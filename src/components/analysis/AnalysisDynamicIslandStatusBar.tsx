import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Loader2,
    CheckCircle,
    X,
    ChevronDown,
    ChevronUp,
    Eye,
    BookOpen,
    FileText,
    FilePlus,
    Lightbulb,
    Target,
    TrendingUp,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis, PhraseAnalysis } from '@/lib/ai/types';

interface AnalysisDynamicIslandStatusBarProps {
    isVisible: boolean;
    isAnalyzing: boolean;
    analysisResult: {
        text: string;
        type: 'word' | 'phrase' | 'sentence' | 'paragraph';
        data: WordAnalysis | PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis;
    } | null;
    error: string | null;
    onClose?: () => void;
    onViewDetails: () => void;
    progress?: number;
    className?: string;
}

type StatusState = 'idle' | 'loading' | 'success' | 'error';

export function AnalysisDynamicIslandStatusBar({
    isVisible,
    isAnalyzing,
    analysisResult,
    error,
    onClose,
    onViewDetails,
    progress = 0,
    className = ""
}: AnalysisDynamicIslandStatusBarProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [status, setStatus] = useState<StatusState>('idle');
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const statusBarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isAnalyzing) {
            setStatus('loading');
            setIsExpanded(false);
            setIsCollapsed(false);
        } else if (error) {
            setStatus('error');
            setIsCollapsed(false);
        } else if (analysisResult) {
            setStatus('success');
            setIsCollapsed(false);
        } else {
            setStatus('idle');
        }
    }, [isAnalyzing, error, analysisResult]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartY(e.clientY);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setCurrentY(e.clientY);
    };

    const handleMouseUp = () => {
        if (!isDragging) return;
        const diff = currentY - startY;
        if (diff > 50) {
            setIsCollapsed(true);
            setIsExpanded(false);
        }
        setIsDragging(false);
        setCurrentY(0);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches && e.touches[0]) {
            setIsDragging(true);
            setStartY(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        if (e.touches && e.touches[0]) {
            setCurrentY(e.touches[0].clientY);
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        const diff = currentY - startY;
        if (diff > 50) {
            setIsCollapsed(true);
            setIsExpanded(false);
        }
        setIsDragging(false);
        setCurrentY(0);
    };

    // Component luôn hiển thị, không bao giờ return null
    // Chỉ thay đổi trạng thái collapsed/expanded

    const transform = isDragging ? `translateY(${Math.max(0, currentY - startY)}px)` : '';
    const opacity = isDragging ? Math.max(0.5, 1 - (currentY - startY) / 100) : 1;
    
    // Nếu component ở trạng thái collapsed, hiển thị dạng thu gọn
    if (isCollapsed) {
        return (
            <div
                ref={statusBarRef}
                className="fixed bottom-6 right-6 z-50 transition-all duration-300 ease-out"
            >
                <div
                    className="bg-black dark:bg-zinc-900 rounded-full shadow-2xl backdrop-blur-xl border border-zinc-800/50 p-3 cursor-pointer hover:scale-110 transition-transform duration-200"
                    onClick={() => {
                        setIsCollapsed(false);
                        setIsExpanded(true);
                    }}
                >
                    <div className="relative">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ChevronUp className="h-3 w-3 text-white" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Loading state - compact like Dynamic Island
    if (status === 'loading') {
        return (
            <div
                ref={statusBarRef}
                className={cn(
                    "fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out",
                    isExpanded ? "w-80" : "w-44",
                    className
                )}
                style={{ transform, opacity }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    className={cn(
                        "bg-black dark:bg-zinc-900 rounded-full shadow-2xl backdrop-blur-xl border border-zinc-800/50",
                        "transition-all duration-500 ease-out overflow-hidden cursor-pointer",
                        isExpanded ? "rounded-3xl" : "rounded-full"
                    )}
                    onClick={() => !isExpanded && setIsExpanded(true)}
                >
                    <div className={cn(
                        "flex items-center gap-3 transition-all duration-500",
                        isExpanded ? "p-4" : "px-4 py-3"
                    )}>
                        <div className="relative">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <div className="absolute inset-0 h-5 w-5 rounded-full bg-blue-500/20 animate-ping" />
                        </div>

                        {!isExpanded && (
                            <span className="text-white text-sm font-medium">Analyzing...</span>
                        )}

                        {isExpanded && (
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-white text-sm font-medium">Analyzing content</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 rounded-full hover:bg-zinc-800"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsCollapsed(true);
                                            setIsExpanded(false);
                                        }}
                                    >
                                        <X className="h-4 w-4 text-zinc-400" />
                                    </Button>
                                </div>
                                <Progress value={progress} className="h-1 bg-zinc-800" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (status === 'error') {
        return (
            <div
                ref={statusBarRef}
                className={cn(
                    "fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out",
                    isExpanded ? "w-80" : "w-44",
                    className
                )}
                style={{ transform, opacity }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    className={cn(
                        "bg-black dark:bg-zinc-900 rounded-full shadow-2xl backdrop-blur-xl border border-red-900/50",
                        "transition-all duration-500 ease-out overflow-hidden cursor-pointer",
                        isExpanded ? "rounded-3xl" : "rounded-full"
                    )}
                    onClick={() => !isExpanded && setIsExpanded(true)}
                >
                    <div className={cn(
                        "flex items-center gap-3 transition-all duration-500",
                        isExpanded ? "p-4" : "px-4 py-3"
                    )}>
                        <AlertCircle className="h-5 w-5 text-red-500" />

                        {!isExpanded && (
                            <span className="text-white text-sm font-medium">Error</span>
                        )}

                        {isExpanded && (
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-white text-sm font-medium">Analysis failed</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 rounded-full hover:bg-zinc-800"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsCollapsed(true);
                                            setIsExpanded(false);
                                        }}
                                    >
                                        <X className="h-4 w-4 text-zinc-400" />
                                    </Button>
                                </div>
                                <p className="text-xs text-zinc-400 mt-1">{error}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Success state
    if (status === 'success' && analysisResult) {
        const { type, data } = analysisResult;

        const getIconAndColor = () => {
            switch (type) {
                case 'word':
                    return { icon: BookOpen, color: 'text-blue-500', gradientFrom: 'from-blue-500', gradientTo: 'to-cyan-500' };
                case 'phrase':
                    return { icon: Sparkles, color: 'text-orange-500', gradientFrom: 'from-orange-500', gradientTo: 'to-amber-500' };
                case 'sentence':
                    return { icon: FileText, color: 'text-green-500', gradientFrom: 'from-green-500', gradientTo: 'to-emerald-500' };
                case 'paragraph':
                    return { icon: FilePlus, color: 'text-purple-500', gradientFrom: 'from-purple-500', gradientTo: 'to-pink-500' };
                default:
                    return { icon: BookOpen, color: 'text-gray-500', gradientFrom: 'from-gray-500', gradientTo: 'to-gray-600' };
            }
        };

        const { icon: Icon, color, gradientFrom, gradientTo } = getIconAndColor();

        const getSummaryInfo = () => {
            switch (type) {
                case 'word':
                    const wordAnalysis = data as WordAnalysis;
                    return {
                        title: wordAnalysis.meta.word,
                        badge: wordAnalysis.meta.cefr,
                        metrics: [
                            { icon: Target, value: wordAnalysis.relations.synonyms.length.toString() }
                        ]
                    };
                case 'phrase':
                    const phraseAnalysis = data as PhraseAnalysis;
                    return {
                        title: phraseAnalysis.meta.phrase,
                        badge: phraseAnalysis.meta.cefr,
                        metrics: []
                    };
                case 'sentence':
                    const sentenceAnalysis = data as SentenceAnalysis;
                    const sentiment = sentenceAnalysis.semantics?.sentiment || 'Neutral';
                    return {
                        title: 'Sentence',
                        badge: sentenceAnalysis.meta.complexity_level,
                        metrics: [
                            { icon: Lightbulb, value: sentiment.slice(0, 3) }
                        ]
                    };
                case 'paragraph':
                    const paragraphAnalysis = data as ParagraphAnalysis;
                    const avgScore = Math.round(
                        (paragraphAnalysis.coherence_and_cohesion.logic_score +
                            paragraphAnalysis.coherence_and_cohesion.flow_score) / 2
                    );
                    return {
                        title: 'Paragraph',
                        badge: paragraphAnalysis.meta.type,
                        metrics: [
                            { icon: TrendingUp, value: avgScore.toString() }
                        ]
                    };
                default:
                    return { title: 'Analysis', badge: '', metrics: [] };
            }
        };

        const summaryInfo = getSummaryInfo();

        return (
            <div
                ref={statusBarRef}
                className={cn(
                    "fixed top-2 right-2 -translate-x-1/2 z-50 transition-all duration-500 ease-out",
                    isExpanded ? "w-96" : "w-52",
                    className
                )}
                style={{ transform, opacity }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    className={cn(
                        "bg-black dark:bg-zinc-900 shadow-2xl backdrop-blur-xl border border-zinc-800/50",
                        "transition-all duration-500 ease-out overflow-hidden cursor-pointer",
                        isExpanded ? "rounded-3xl" : "rounded-full"
                    )}
                    onClick={() => !isExpanded && setIsExpanded(true)}
                >
                    <div className={cn(
                        "flex items-center transition-all duration-500",
                        isExpanded ? "p-4 flex-col" : "px-4 py-3 flex-row gap-3"
                    )}>
                        <div className={cn(
                            "flex items-center gap-3",
                            isExpanded ? "w-full" : ""
                        )}>
                            <div className="relative">
                                <div className={cn(
                                    "absolute inset-0 rounded-full bg-gradient-to-br blur-md",
                                    gradientFrom,
                                    gradientTo,
                                    "opacity-50"
                                )} />
                                <div className="relative bg-zinc-900 rounded-full p-2">
                                    <Icon className={cn("h-4 w-4", color)} />
                                </div>
                            </div>

                            {!isExpanded && (
                                <>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-white text-sm font-medium truncate">
                                        {summaryInfo.title}
                                    </span>
                                </>
                            )}

                            {isExpanded && (
                                <div className="flex-1 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="text-white text-sm font-medium truncate">
                                            {summaryInfo.title}
                                        </span>
                                        {summaryInfo.badge && (
                                            <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-700 bg-zinc-800/50">
                                                {summaryInfo.badge}
                                            </Badge>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 rounded-full hover:bg-zinc-800"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsCollapsed(true);
                                            setIsExpanded(false);
                                        }}
                                    >
                                        <X className="h-4 w-4 text-zinc-400" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {isExpanded && (
                            <div className="w-full space-y-3 mt-3">
                                {summaryInfo.metrics.length > 0 && (
                                    <div className="flex items-center gap-4">
                                        {summaryInfo.metrics.map((metric, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-zinc-800/50 rounded-full px-3 py-1.5">
                                                <metric.icon className="h-3 w-3 text-zinc-400" />
                                                <span className="text-xs text-white font-medium">{metric.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewDetails();
                                        }}
                                        className="flex-1 bg-zinc-800/50 hover:bg-zinc-800 text-white rounded-full h-9"
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Details
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 w-9 p-0 rounded-full hover:bg-zinc-800"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsExpanded(false);
                                        }}
                                    >
                                        <ChevronUp className="h-4 w-4 text-zinc-400" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Component luôn hiển thị một indicator nhỏ ngay cả ở trạng thái idle
    return (
        <div
            ref={statusBarRef}
            className="fixed bottom-6 right-6 z-50 transition-all duration-300 ease-out"
        >
            <div
                className="bg-black dark:bg-zinc-900 rounded-full shadow-2xl backdrop-blur-xl border border-zinc-800/50 p-3 cursor-pointer hover:scale-110 transition-transform duration-200"
                onClick={() => setIsExpanded(true)}
            >
                <div className="relative">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-gray-500 to-gray-600" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ChevronUp className="h-3 w-3 text-white" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnalysisDynamicIslandStatusBar;