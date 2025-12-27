
# JP's notes

* change redis expiry:
  * Time-based expiry - Redis keys expire after 24 hours anyway
* docker compose up -d extras-api
* docker compose build
* docker compose restart
* docker compose restart api
* docker compose restart extras-api
* docker compose down && docker compose up -d --build
* docker compose logs -f
* docker ps
* docker compose logs -f api
* docker compose logs -f extras-api
* <http://localhost:5001/status>
* <http://localhost:5001/health>
* map

```sh
curl -X POST http://localhost:3002/v1/map \
    -H 'Content-Type: application/json' \
    -d '{
      "url": "https://www.jayaprakash.net"
    }'
```

* crawl

```sh
curl -X POST http://localhost:3002/v1/crawl \
    -H 'Content-Type: application/json' \
    -d '{
      "url": "https://www.jayaprakash.net",
      "ignoreSitemap": true
    }'
```

*
