import React from 'react';

export function FormattedText({ content }: { content: string }) {
    const lines = content.split('\n');
    
    // Helper to render bold text
    const renderBoldText = (text: string) => {
        const parts = text.split(/\*\*(.+?)\*\*/);
        if (parts.length === 1) return text;
        
        return parts.map((part, i) => 
            i % 2 === 1 ? (
                <strong key={i} className="font-bold text-emerald-600 dark:text-emerald-400">
                    {part}
                </strong>
            ) : (
                <span key={i}>{part}</span>
            )
        );
    };
    
    return (
        <div className="space-y-2">
            {lines.map((line, idx) => {
                // Handle numbered lists
                if (/^\d+\.\s/.test(line)) {
                    const match = line.match(/^\d+\.\s(.+?):\s(.+)$/);
                    if (match) {
                        const number = line.match(/^\d+\./)?.[0];
                        const heading = match[1];
                        const rest = match[2];
                        const capitalizedRest = rest.charAt(0).toUpperCase() + rest.slice(1);
                        
                        return (
                            <div key={idx} className="flex gap-2 ml-2">
                                <span className="flex-shrink-0 font-bold text-emerald-600 dark:text-emerald-400">
                                    {number}
                                </span>
                                <span>
                                    <strong className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {renderBoldText(heading)}
                                    </strong>
                                    <strong className="font-bold text-emerald-600 dark:text-emerald-400">:</strong>
                                    {' '}{renderBoldText(capitalizedRest)}
                                </span>
                            </div>
                        );
                    } else {
                        const text = line.replace(/^\d+\.\s/, '');
                        return (
                            <div key={idx} className="flex gap-2 ml-2">
                                <span className="flex-shrink-0 font-bold text-emerald-600 dark:text-emerald-400">
                                    {line.match(/^\d+\./)?.[0]}
                                </span>
                                <span>{renderBoldText(text)}</span>
                            </div>
                        );
                    }
                }
                
                // Handle bullet points
                if (/^[\*\-]\s/.test(line)) {
                    const text = line.replace(/^[\*\-]\s/, '');
                    return (
                        <div key={idx} className="flex gap-2 ml-2">
                            <span className="flex-shrink-0 text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                            <span>{renderBoldText(text)}</span>
                        </div>
                    );
                }
                
                // Regular text with bold formatting
                return line.trim() ? (
                    <p key={idx} className="leading-relaxed">
                        {renderBoldText(line)}
                    </p>
                ) : (
                    <div key={idx} className="h-1" />
                );
            })}
        </div>
    );
}
