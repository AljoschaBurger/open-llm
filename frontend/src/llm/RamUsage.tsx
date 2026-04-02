import React, { useEffect, useState } from 'react';

interface RamInfo {
    total: number;
    used: number;
    free: number;
    usedPercent: number;
}

const RamUsage: React.FC = () => {
    const [ramInfo, setRamInfo] = useState<RamInfo | null>(null);

    useEffect(() => {
        const fetchRamUsage = async () => {
            try {
                const response = await fetch('http://localhost:8080/ram');
                if (response.ok) {
                    const data: RamInfo = await response.json();
                    setRamInfo(data);
                }
            } catch (error) {
                console.error('Error fetching RAM usage:', error);
            }
        };

        fetchRamUsage();
        const interval = setInterval(fetchRamUsage, 2000); // Update every 2 seconds

        return () => clearInterval(interval);
    }, []);

    if (!ramInfo) return null;

    const formatBytes = (bytes: number) => {
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    };

    return (
        <div className="fixed  top-24 left-20 z-50 p-4 bg-gray-800 rounded-xl border border-purple-500 shadow-lg shadow-purple-900/20 font-mono text-xs text-white flex flex-col gap-2">
            <div className="flex justify-between items-center gap-4">
                <span className="font-bold text-purple-400">RAM Usage</span>
                <span className={ramInfo.usedPercent > 80 ? 'text-red-400' : 'text-green-400'}>
                    {ramInfo.usedPercent.toFixed(1)}%
                </span>
            </div>
            
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-500 ease-out ${
                        ramInfo.usedPercent > 80 ? 'bg-red-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${ramInfo.usedPercent}%` }}
                />
            </div>

            <div className="flex flex-col text-[10px] text-gray-400">
                <span>Used: {formatBytes(ramInfo.used)}</span>
                <span>Total: {formatBytes(ramInfo.total)}</span>
            </div>
        </div>
    );
};

export default RamUsage;
