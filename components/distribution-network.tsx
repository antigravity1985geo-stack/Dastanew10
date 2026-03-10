"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Truck, Warehouse, Store, Factory } from "lucide-react";

const nodes = [
    {
        id: "factory",
        label: "წარმოება",
        sublabel: "Factory",
        Icon: Factory,
        x: 10,
        y: 50,
        color: "hsl(193 100% 50%)",
        delay: 0,
    },
    {
        id: "warehouse",
        label: "საწყობი",
        sublabel: "Warehouse",
        Icon: Warehouse,
        x: 40,
        y: 20,
        color: "hsl(280 70% 60%)",
        delay: 0.2,
    },
    {
        id: "warehouse2",
        label: "განაწილება",
        sublabel: "Distribution",
        Icon: Truck,
        x: 40,
        y: 80,
        color: "hsl(22 100% 59%)",
        delay: 0.4,
    },
    {
        id: "store1",
        label: "მაღაზია 1",
        sublabel: "POS Terminal",
        Icon: Store,
        x: 75,
        y: 15,
        color: "hsl(142 76% 45%)",
        delay: 0.6,
    },
    {
        id: "store2",
        label: "მაღაზია 2",
        sublabel: "POS Terminal",
        Icon: Store,
        x: 75,
        y: 50,
        color: "hsl(142 76% 45%)",
        delay: 0.8,
    },
    {
        id: "store3",
        label: "მაღაზია 3",
        sublabel: "POS Terminal",
        Icon: Store,
        x: 75,
        y: 85,
        color: "hsl(142 76% 45%)",
        delay: 1.0,
    },
];

const connections = [
    { from: "factory", to: "warehouse", color: "hsl(193 100% 50%)" },
    { from: "factory", to: "warehouse2", color: "hsl(193 100% 50%)" },
    { from: "warehouse", to: "store1", color: "hsl(280 70% 60%)" },
    { from: "warehouse", to: "store2", color: "hsl(280 70% 60%)" },
    { from: "warehouse2", to: "store3", color: "hsl(22 100% 59%)" },
    { from: "warehouse2", to: "store2", color: "hsl(22 100% 59%)" },
];

function getNodePos(id: string) {
    const node = nodes.find((n) => n.id === id);
    return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
}

export default function DistributionNetwork() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [activePacket, setActivePacket] = useState(0);

    useEffect(() => {
        if (!isInView) return;
        const interval = setInterval(() => {
            setActivePacket((prev) => (prev + 1) % connections.length);
        }, 1500);
        return () => clearInterval(interval);
    }, [isInView]);

    return (
        <div ref={ref} className="relative w-full h-full">
            {/* SVG connections */}
            <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                <defs>
                    {connections.map((conn, i) => (
                        <linearGradient key={i} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={conn.color} stopOpacity="0.6" />
                            <stop offset="100%" stopColor={conn.color} stopOpacity="0.2" />
                        </linearGradient>
                    ))}
                </defs>

                {connections.map((conn, i) => {
                    const from = getNodePos(conn.from);
                    const to = getNodePos(conn.to);

                    return (
                        <g key={i}>
                            {/* Background line */}
                            <line
                                x1={`${from.x}%`}
                                y1={`${from.y}%`}
                                x2={`${to.x}%`}
                                y2={`${to.y}%`}
                                stroke={conn.color}
                                strokeWidth="0.3"
                                strokeOpacity="0.15"
                            />
                            {/* Animated line */}
                            {isInView && (
                                <motion.line
                                    x1={`${from.x}%`}
                                    y1={`${from.y}%`}
                                    x2={`${to.x}%`}
                                    y2={`${to.y}%`}
                                    stroke={conn.color}
                                    strokeWidth="0.4"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 0.5 }}
                                    transition={{ duration: 1, delay: 0.3 + i * 0.15 }}
                                />
                            )}

                            {/* Data packet */}
                            {isInView && activePacket === i && (
                                <motion.circle
                                    r="1.2"
                                    fill={conn.color}
                                    initial={{ cx: `${from.x}%`, cy: `${from.y}%` }}
                                    animate={{ cx: `${to.x}%`, cy: `${to.y}%` }}
                                    transition={{ duration: 1.2, ease: "easeInOut" }}
                                />
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => (
                <motion.div
                    key={node.id}
                    className="absolute flex flex-col items-center gap-1"
                    style={{
                        left: `${node.x}%`,
                        top: `${node.y}%`,
                        transform: "translate(-50%, -50%)",
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{
                        duration: 0.6,
                        delay: node.delay,
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                    }}
                >
                    {/* Node circle */}
                    <div
                        className="relative flex items-center justify-center rounded-xl"
                        style={{
                            width: "44px",
                            height: "44px",
                            background: `linear-gradient(135deg, ${node.color}20, ${node.color}08)`,
                            border: `1px solid ${node.color}40`,
                            boxShadow: `0 0 20px ${node.color}20`,
                        }}
                    >
                        <node.Icon
                            size={18}
                            style={{ color: node.color }}
                        />
                        {/* Pulse ring */}
                        <motion.div
                            className="absolute inset-0 rounded-xl"
                            style={{ border: `1px solid ${node.color}60` }}
                            animate={{
                                scale: [1, 1.4, 1],
                                opacity: [0.6, 0, 0.6],
                            }}
                            transition={{ duration: 3, repeat: Infinity, delay: node.delay }}
                        />
                    </div>

                    {/* Label */}
                    <div className="text-center whitespace-nowrap">
                        <div
                            className="font-semibold"
                            style={{ fontSize: "9px", color: node.color, lineHeight: 1.2 }}
                        >
                            {node.label}
                        </div>
                        <div
                            className="font-mono text-slate-500"
                            style={{ fontSize: "7px", lineHeight: 1.2 }}
                        >
                            {node.sublabel}
                        </div>
                    </div>
                </motion.div>
            ))}

            {/* Live data badges */}
            <motion.div
                className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                    background: "hsl(142 76% 45% / 0.1)",
                    border: "1px solid hsl(142 76% 45% / 0.3)",
                    fontSize: "9px",
                }}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1.5 }}
            >
                <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "hsl(142 76% 45%)" }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span style={{ color: "hsl(142 76% 45%)", fontFamily: "var(--font-mono)" }}>
                    LIVE TRACKING
                </span>
            </motion.div>
        </div>
    );
}
