import React from 'react';
import { motion } from 'framer-motion';
import { useTerminology } from '@/hooks/useTerminology';

interface Platform {
    name: string;
    presence: number; // 0-100
    color: string;
    orbitRadius: number;
    speed: number;
}

interface AIPlatformGalaxyProps {
    brandName: string;
}

const AIPlatformGalaxy: React.FC<AIPlatformGalaxyProps> = ({ brandName }) => {
    const { t } = useTerminology();

    const platforms: Platform[] = [
        { name: 'ChatGPT', presence: 85, color: '#10a37f', orbitRadius: 100, speed: 20 },
        { name: 'Gemini', presence: 60, color: '#4285f4', orbitRadius: 160, speed: 25 },
        { name: 'Claude', presence: 75, color: '#cc785c', orbitRadius: 220, speed: 30 },
        { name: 'Perplexity', presence: 45, color: '#1fb8cd', orbitRadius: 280, speed: 35 },
    ];

    return (
        <div className="bg-gray-900 rounded-2xl p-8 text-white overflow-hidden relative min-h-[600px] flex items-center justify-center">
            {/* Background Stars */}
            <div className="absolute inset-0">
                {[...Array(50)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-white opacity-20"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            width: `${Math.random() * 3}px`,
                            height: `${Math.random() * 3}px`,
                        }}
                    />
                ))}
            </div>

            {/* Central Brand Sun */}
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent shadow-[0_0_60px_rgba(255,255,255,0.3)] flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full bg-white opacity-10 animate-pulse" />
                    <span className="font-serif font-bold text-xl text-center px-2">{brandName}</span>
                </div>
            </div>

            {/* Orbits and Planets */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {platforms.map((platform, i) => (
                    <React.Fragment key={platform.name}>
                        {/* Orbit Path */}
                        <div
                            className="absolute rounded-full border border-white/10"
                            style={{
                                width: platform.orbitRadius * 2,
                                height: platform.orbitRadius * 2,
                            }}
                        />

                        {/* Planet */}
                        <motion.div
                            className="absolute"
                            style={{
                                width: platform.orbitRadius * 2,
                                height: platform.orbitRadius * 2,
                            }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: platform.speed, repeat: Infinity, ease: "linear" }}
                        >
                            <div
                                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                            >
                                <div
                                    className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center mb-2 relative group pointer-events-auto cursor-pointer"
                                    style={{ backgroundColor: platform.color }}
                                >
                                    <span className="text-xs font-bold">{platform.presence}%</span>

                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 bg-white text-gray-900 text-xs p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        {platform.name} Presence
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-gray-400">{platform.name}</span>
                            </div>
                        </motion.div>
                    </React.Fragment>
                ))}
            </div>

            {/* Legend/Controls */}
            <div className="absolute bottom-8 left-8 z-20">
                <h3 className="text-lg font-bold mb-2">AI Platform Galaxy</h3>
                <p className="text-sm text-gray-400 max-w-xs">
                    Visualizing your brand&apos;s gravitational pull across the AI universe. Closer orbits indicate stronger alignment and presence.
                </p>
            </div>
        </div>
    );
};

export default AIPlatformGalaxy;
