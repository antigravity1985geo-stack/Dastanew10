import { useState, useEffect } from 'react';

type HeaderState = {
    title: string | React.ReactNode;
    actions: React.ReactNode | null;
};

let currentState: HeaderState = {
    title: "DASTA CLOUD JR",
    actions: null,
};

const listeners = new Set<(state: HeaderState) => void>();

export const headerStore = {
    getState: () => currentState,
    setHeader: (title: string | React.ReactNode, actions: React.ReactNode | null) => {
        currentState = { title, actions };
        listeners.forEach(l => l(currentState));
    },
    clearHeader: () => {
        currentState = { title: "DASTA CLOUD JR", actions: null };
        listeners.forEach(l => l(currentState));
    },
    subscribe: (listener: (state: HeaderState) => void) => {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }
};

export function useHeader() {
    const [state, setState] = useState(currentState);

    useEffect(() => {
        return headerStore.subscribe(setState);
    }, []);

    return state;
}

export function useHeaderSetup(title: string | React.ReactNode, actions: React.ReactNode | null = null) {
    useEffect(() => {
        headerStore.setHeader(title, actions);
        // We don't clear on unmount here to avoid flicker during transitions
        // until the next page sets its header.
    }, [title, actions]);
}
