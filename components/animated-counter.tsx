"use client";

import { useRef, useState, useEffect } from "react";
import { useInView } from "framer-motion";

interface AnimatedCounterProps {
    target: number;
    suffix?: string;
    prefix?: string;
    duration?: number;
}

export default function AnimatedCounter({
    target,
    suffix = "",
    prefix = "",
    duration = 2000,
}: AnimatedCounterProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isInView) return;

        const start = Date.now();
        const step = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));

            if (progress < 1) requestAnimationFrame(step);
            else setCount(target);
        };

        requestAnimationFrame(step);
    }, [isInView, target, duration]);

    const formatted = count.toLocaleString("ka-GE");

    return (
        <span ref={ref}>
            {prefix}{formatted}{suffix}
        </span>
    );
}
