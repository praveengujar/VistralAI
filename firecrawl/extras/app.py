"""
Flask API for Firecrawl Job Status
Provides endpoints to view job statuses from the NuQ queue
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import datetime
import logging
import redis

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv('NUQ_DATABASE_URL', 'postgresql://postgres:postgres@nuq-postgres:5432/postgres')
QUEUE_SCHEMA = 'nuq'
QUEUE_TABLE = 'queue_scrape'
QUEUE_BACKLOG_TABLE = 'queue_scrape_backlog'

# Redis configuration
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
redis_client = None

def get_redis_connection():
    """Get or create Redis connection"""
    global redis_client
    if redis_client is None:
        try:
            redis_client = redis.from_url(REDIS_URL, decode_responses=True)
            redis_client.ping()  # Test connection
            logger.info("Redis connection established")
        except Exception as e:
            logger.error(f"Redis connection error: {e}")
            redis_client = None
    return redis_client

def get_db_connection():
    """Create a database connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise

def serialize_datetime(obj):
    """JSON serializer for datetime objects"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        conn = get_db_connection()
        conn.close()
        return jsonify({
            'status': 'healthy',
            'service': 'firecrawl-status-api',
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 503

@app.route('/status', methods=['GET'])
def get_all_jobs():
    """
    Get all jobs with their statuses
    Query parameters:
    - limit: Number of jobs to return (default: 100, max: 1000)
    - offset: Offset for pagination (default: 0)
    - status: Filter by status (queued, active, completed, failed, backlog)
    - order: Order by field (created_at, finished_at, priority) (default: created_at)
    - direction: Sort direction (asc, desc) (default: desc)
    """
    try:
        # Parse query parameters
        limit = min(int(request.args.get('limit', 100)), 1000)
        offset = int(request.args.get('offset', 0))
        status_filter = request.args.get('status', None)
        order_by = request.args.get('order', 'created_at')
        direction = request.args.get('direction', 'desc').upper()

        # Validate parameters
        valid_order_fields = ['created_at', 'finished_at', 'priority', 'status']
        if order_by not in valid_order_fields:
            order_by = 'created_at'

        if direction not in ['ASC', 'DESC']:
            direction = 'DESC'

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Build query
        base_query = f"""
            SELECT
                id,
                status::text as status,
                created_at,
                finished_at,
                priority,
                data->>'url' as url,
                data->>'mode' as mode,
                data->>'team_id' as team_id,
                data->>'crawl_id' as crawl_id,
                data->>'origin' as origin,
                failedreason as failed_reason,
                owner_id,
                group_id
            FROM {QUEUE_SCHEMA}.{QUEUE_TABLE}
        """

        count_query = f'SELECT COUNT(*) as total FROM {QUEUE_SCHEMA}.{QUEUE_TABLE}'

        params = []

        if status_filter:
            base_query += " WHERE status = %s::nuq.job_status"
            count_query += " WHERE status = %s::nuq.job_status"
            params.append(status_filter)

        base_query += f" ORDER BY {order_by} {direction} LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        # Get total count
        cursor.execute(count_query, params[:-2] if status_filter else [])
        total = cursor.fetchone()['total']

        # Get jobs
        cursor.execute(base_query, params)
        jobs = cursor.fetchall()

        # Convert to list of dicts and handle datetime serialization
        jobs_list = []
        for job in jobs:
            job_dict = dict(job)
            if job_dict.get('created_at'):
                job_dict['created_at'] = job_dict['created_at'].isoformat()
            if job_dict.get('finished_at'):
                job_dict['finished_at'] = job_dict['finished_at'].isoformat()
            jobs_list.append(job_dict)

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'data': {
                'jobs': jobs_list,
                'pagination': {
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                    'returned': len(jobs_list)
                }
            },
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Error fetching jobs: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/status/stats', methods=['GET'])
def get_job_stats():
    """Get job statistics grouped by status"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        query = f"""
            SELECT
                status::text as status,
                COUNT(*) as count
            FROM {QUEUE_SCHEMA}.{QUEUE_TABLE}
            GROUP BY status
            UNION ALL
            SELECT
                'backlog'::text as status,
                COUNT(*) as count
            FROM {QUEUE_SCHEMA}.{QUEUE_BACKLOG_TABLE}
        """

        cursor.execute(query)
        stats = cursor.fetchall()

        # Convert to dictionary
        stats_dict = {row['status']: row['count'] for row in stats}

        # Calculate total
        total = sum(stats_dict.values())

        cursor.close()
        conn.close()

        # Get cache statistics from Redis
        cache_stats = {}
        try:
            r = get_redis_connection()
            if r:
                hits = int(r.get('global:crawl_cache:stats:hits') or 0)
                misses = int(r.get('global:crawl_cache:stats:misses') or 0)
                stores = int(r.get('global:crawl_cache:stats:stores') or 0)

                # Count cached URLs (keys matching the pattern)
                cached_urls = 0
                try:
                    # Use SCAN to count keys matching the pattern
                    cursor_val = 0
                    while True:
                        cursor_val, keys = r.scan(cursor_val, match='global:crawl_cache:*', count=1000)
                        # Filter out stats keys
                        cached_urls += len([k for k in keys if not k.startswith('global:crawl_cache:stats:')])
                        if cursor_val == 0:
                            break
                except:
                    cached_urls = -1  # Indicate error

                total_requests = hits + misses
                hit_rate = (hits / total_requests * 100) if total_requests > 0 else 0

                cache_stats = {
                    'enabled': True,
                    'hits': hits,
                    'misses': misses,
                    'stores': stores,
                    'cached_urls': cached_urls,
                    'total_requests': total_requests,
                    'hit_rate_percent': round(hit_rate, 2)
                }
        except Exception as e:
            logger.warning(f"Error fetching cache stats: {e}")
            cache_stats = {
                'enabled': False,
                'error': str(e)
            }

        return jsonify({
            'success': True,
            'data': {
                'queue_stats': stats_dict,
                'total_jobs': total,
                'cache_stats': cache_stats
            },
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/status/domains', methods=['GET'])
def get_domain_stats():
    """Aggregate crawled pages per domain"""
    try:
        limit = min(int(request.args.get('limit', 25)), 200)

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        query = f"""
            WITH domain_data AS (
                SELECT
                    LOWER(
                        SPLIT_PART(
                            REGEXP_REPLACE(data->>'url', '^https?://(www\\.)?', ''),
                            '/',
                            1
                        )
                    ) AS domain,
                    status::text AS status,
                    finished_at
                FROM {QUEUE_SCHEMA}.{QUEUE_TABLE}
                WHERE data->>'url' IS NOT NULL
            )
            SELECT
                domain,
                COUNT(*) AS total_jobs,
                COUNT(*) FILTER (WHERE status = 'completed') AS completed_jobs,
                COUNT(*) FILTER (WHERE status = 'failed') AS failed_jobs,
                MAX(finished_at) AS last_finished_at
            FROM domain_data
            WHERE domain IS NOT NULL AND domain <> ''
            GROUP BY domain
            ORDER BY completed_jobs DESC, total_jobs DESC
            LIMIT %s
        """

        cursor.execute(query, (limit,))
        rows = cursor.fetchall()

        cursor.close()
        conn.close()

        domains = []
        for row in rows:
            domain_entry = {
                'domain': row['domain'],
                'total_jobs': row['total_jobs'],
                'completed_jobs': row['completed_jobs'],
                'failed_jobs': row['failed_jobs'],
            }
            if row['last_finished_at']:
                domain_entry['last_finished_at'] = row['last_finished_at'].isoformat()
            domains.append(domain_entry)

        return jsonify({
            'success': True,
            'data': {
                'domains': domains,
                'metadata': {
                    'limit': limit,
                    'returned': len(domains)
                }
            },
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Error fetching domain stats: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/status/<job_id>', methods=['GET'])
def get_job_by_id(job_id):
    """Get a specific job by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        query = f"""
            SELECT
                id,
                status::text as status,
                created_at,
                finished_at,
                priority,
                data,
                failedreason as failed_reason,
                owner_id,
                group_id
            FROM {QUEUE_SCHEMA}.{QUEUE_TABLE}
            WHERE id = %s
        """

        cursor.execute(query, [job_id])
        job = cursor.fetchone()

        cursor.close()
        conn.close()

        if not job:
            return jsonify({
                'success': False,
                'error': 'Job not found',
                'timestamp': datetime.now().isoformat()
            }), 404

        # Convert datetime objects
        job_dict = dict(job)
        if job_dict.get('created_at'):
            job_dict['created_at'] = job_dict['created_at'].isoformat()
        if job_dict.get('finished_at'):
            job_dict['finished_at'] = job_dict['finished_at'].isoformat()

        return jsonify({
            'success': True,
            'data': job_dict,
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Error fetching job {job_id}: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/', methods=['GET'])
def index():
    """API documentation"""
    return jsonify({
        'service': 'Firecrawl Job Status API',
        'version': '1.0.0',
        'endpoints': {
            '/health': 'Health check endpoint',
            '/status': 'Get all jobs with pagination and filtering',
            '/status/stats': 'Get job statistics grouped by status',
            '/status/domains': 'Get aggregate crawl counts per domain',
            '/status/<job_id>': 'Get a specific job by ID'
        },
        'documentation': {
            '/status': {
                'method': 'GET',
                'parameters': {
                    'limit': 'Number of jobs to return (default: 100, max: 1000)',
                    'offset': 'Offset for pagination (default: 0)',
                    'status': 'Filter by status (queued, active, completed, failed, backlog)',
                    'order': 'Order by field (created_at, finished_at, priority)',
                    'direction': 'Sort direction (asc, desc)'
                },
                'example': '/status?limit=50&status=completed&order=finished_at&direction=desc'
            },
            '/status/domains': {
                'method': 'GET',
                'parameters': {
                    'limit': 'Number of domains to return (default: 25, max: 200)'
                },
                'example': '/status/domains?limit=50'
            },
        }
    }), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
