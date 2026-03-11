"use client";

import React, { useState } from 'react';
import { TransformWrapper, TransformComponent, useTransformContext } from "react-zoom-pan-pinch";
import { Maximize2, Minimize2, RefreshCw, X, ChevronLeft, Layers } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Material { id: string; label: string; color: string }
interface FurnitureItem {
    id: string; icon: string; label: string;
    // Per-item bounding box for precise color overlay (% of image canvas)
    box: { left: number; top: number; width: number; height: number };
    materials: { label: string; options: Material[] }[];
}
interface Room {
    id: string; label: string; icon: string;
    x: number; y: number; // pin position % of image
    inventory: FurnitureItem[];
}
interface Overlay { itemKey: string; color: string; opacity: number; box: FurnitureItem['box'] }

// ─── Palettes ────────────────────────────────────────────────────────────────
const FLOOR: Material[] = [
    { id: 'oak', label: 'Oak Wood', color: '#c19a6b' },
    { id: 'walnut', label: 'Dark Walnut', color: '#5c3317' },
    { id: 'marble', label: 'White Marble', color: '#f0ece4' },
    { id: 'tile', label: 'Ceramic Tile', color: '#ddd9d0' },
    { id: 'concrete', label: 'Concrete', color: '#9e9e9e' },
    { id: 'herringbone', label: 'Herringbone', color: '#b5824e' },
];
const WALL: Material[] = [
    { id: 'white', label: 'Off White', color: '#f8f4ef' },
    { id: 'sage', label: 'Sage Green', color: '#8aab8a' },
    { id: 'clay', label: 'Clay', color: '#c4906a' },
    { id: 'navy', label: 'Navy Blue', color: '#2c3e6b' },
    { id: 'charcoal', label: 'Charcoal', color: '#3c3c3c' },
    { id: 'blush', label: 'Blush Pink', color: '#e8b4a0' },
];
const SOFA: Material[] = [
    { id: 'terra', label: 'Terracotta', color: '#c05e3e' },
    { id: 'ivory', label: 'Ivory', color: '#f5f0e1' },
    { id: 'slate', label: 'Slate Grey', color: '#6a7480' },
    { id: 'olive', label: 'Olive', color: '#6b7246' },
    { id: 'midnight', label: 'Midnight Blue', color: '#1a2a4a' },
    { id: 'camel', label: 'Camel', color: '#c4a265' },
];
const WOOD: Material[] = [
    { id: 'walnut', label: 'Dark Walnut', color: '#5c3317' },
    { id: 'oak', label: 'Natural Oak', color: '#c19a6b' },
    { id: 'white', label: 'White MDF', color: '#f0ede8' },
    { id: 'teak', label: 'Teak Brown', color: '#9b6a3b' },
];
const STONE: Material[] = [
    { id: 'granite', label: 'Black Granite', color: '#2b2b2b' },
    { id: 'quartz', label: 'White Quartz', color: '#f2f2ef' },
    { id: 'marble', label: 'Calacatta', color: '#f0ece4' },
    { id: 'verde', label: 'Verde Marble', color: '#7a9b82' },
];
const TILE: Material[] = [
    { id: 'hex', label: 'Hexagon Grey', color: '#d5cfc4' },
    { id: 'subway', label: 'Subway White', color: '#e8e4dd' },
    { id: 'zellige', label: 'Zellige Green', color: '#8aab8a' },
    { id: 'terracotta', label: 'Terracotta', color: '#c05e3e' },
];
const CURTAIN: Material[] = [
    { id: 'linen', label: 'Natural Linen', color: '#d6c9a8' },
    { id: 'gray', label: 'Pewter Grey', color: '#8c8c8c' },
    { id: 'navy', label: 'Navy Blue', color: '#1a2a4a' },
    { id: 'blush', label: 'Blush Pink', color: '#e8b4a0' },
];

// ─── Image canvas reference (px) ────────────────────────────────────────────
// Internal canvas: 1118 × 834 px
// All box values below are % of these dimensions, verified against the floor plan image.

const ROOMS: Room[] = [
    {
        id: 'kitchen', label: 'Kitchen', icon: '🍳',
        x: 24, y: 27, // pin: center of kitchen hex tile area
        inventory: [
            { id: 'floor', icon: '🪵', label: 'Floor Tiles', box: { left: 3, top: 3, width: 29, height: 42 }, materials: [{ label: 'Choose material', options: FLOOR }] },
            { id: 'wall', icon: '🎨', label: 'Wall Paint', box: { left: 3, top: 3, width: 29, height: 42 }, materials: [{ label: 'Choose color', options: WALL }] },
            { id: 'countertop', icon: '⬜', label: 'Countertop', box: { left: 12, top: 15, width: 18, height: 20 }, materials: [{ label: 'Stone finish', options: STONE }] },
            { id: 'backsplash', icon: '🔲', label: 'Backsplash', box: { left: 12, top: 5, width: 18, height: 12 }, materials: [{ label: 'Tile style', options: TILE }] },
        ]
    },
    {
        id: 'mbed', label: 'Master Bedroom', icon: '🛏️',
        x: 87, y: 19, // pin: center of M.BED ROOM label
        inventory: [
            { id: 'floor', icon: '🪵', label: 'Flooring', box: { left: 69, top: 2, width: 29, height: 38 }, materials: [{ label: 'Choose material', options: FLOOR }] },
            { id: 'wall', icon: '🎨', label: 'Wall Paint', box: { left: 69, top: 2, width: 29, height: 38 }, materials: [{ label: 'Choose color', options: WALL }] },
            { id: 'bed', icon: '🛏️', label: 'Bed & Headboard', box: { left: 73, top: 4, width: 22, height: 23 }, materials: [{ label: 'Bed frame finish', options: WOOD }] },
            { id: 'wardrobe', icon: '🪞', label: 'Wardrobe', box: { left: 73, top: 29, width: 24, height: 9 }, materials: [{ label: 'Door finish', options: [...WOOD, { id: 'mirror', label: 'Mirror', color: '#c9d8e0' }] }] },
            { id: 'curtains', icon: '🪟', label: 'Curtains', box: { left: 69, top: 2, width: 3, height: 36 }, materials: [{ label: 'Fabric & color', options: CURTAIN }] },
            { id: 'sofa', icon: '🛋️', label: 'Sitting Sofa', box: { left: 90, top: 18, width: 8, height: 12 }, materials: [{ label: 'Upholstery', options: SOFA }] },
        ]
    },
    {
        id: 'bed2', label: 'Bedroom 2', icon: '🛏️',
        x: 56, y: 18,
        inventory: [
            { id: 'floor', icon: '🪵', label: 'Flooring', box: { left: 37, top: 2, width: 30, height: 38 }, materials: [{ label: 'Choose material', options: FLOOR }] },
            { id: 'wall', icon: '🎨', label: 'Wall Paint', box: { left: 37, top: 2, width: 30, height: 38 }, materials: [{ label: 'Choose color', options: WALL }] },
            { id: 'bed', icon: '🛏️', label: 'Bed & Headboard', box: { left: 42, top: 4, width: 18, height: 24 }, materials: [{ label: 'Bed frame finish', options: WOOD }] },
            { id: 'wardrobe', icon: '🪞', label: 'Wardrobe', box: { left: 42, top: 30, width: 24, height: 8 }, materials: [{ label: 'Door finish', options: [...WOOD, { id: 'mirror', label: 'Mirror', color: '#c9d8e0' }] }] },
            { id: 'curtains', icon: '🪟', label: 'Curtains', box: { left: 37, top: 2, width: 3, height: 36 }, materials: [{ label: 'Fabric & color', options: CURTAIN }] },
        ]
    },
    {
        id: 'living', label: 'Living / Dining', icon: '🛋️',
        x: 65, y: 57,
        inventory: [
            { id: 'floor', icon: '🪵', label: 'Flooring', box: { left: 32, top: 42, width: 50, height: 30 }, materials: [{ label: 'Choose material', options: FLOOR }] },
            { id: 'wall', icon: '🎨', label: 'Wall Paint', box: { left: 32, top: 42, width: 50, height: 30 }, materials: [{ label: 'Choose color', options: WALL }] },
            { id: 'living-sofa', icon: '🛋️', label: 'Living Sofa Set', box: { left: 58, top: 45, width: 18, height: 18 }, materials: [{ label: 'Upholstery', options: SOFA }] },
            { id: 'dining-table', icon: '🍽️', label: 'Dining Table', box: { left: 43, top: 51, width: 11, height: 14 }, materials: [{ label: 'Table finish', options: WOOD }] },
            { id: 'dining-chairs', icon: '🪑', label: 'Dining Chairs', box: { left: 40, top: 49, width: 17, height: 18 }, materials: [{ label: 'Chair finish', options: [...WOOD, ...SOFA.slice(0, 3)] }] },
            { id: 'rug', icon: '🔲', label: 'Area Rug', box: { left: 55, top: 44, width: 22, height: 24 }, materials: [{ label: 'Rug color', options: [{ id: 'cream', label: 'Cream', color: '#ede9de' }, { id: 'charcoal', label: 'Charcoal', color: '#3c3c3c' }, { id: 'terra', label: 'Terracotta', color: '#c05e3e' }, { id: 'sage', label: 'Sage', color: '#8aab8a' }] }] },
            { id: 'tv-unit', icon: '📺', label: 'TV Cabinet', box: { left: 81, top: 52, width: 4, height: 6 }, materials: [{ label: 'Cabinet finish', options: WOOD }] },
        ]
    },
    {
        id: 'multipurpose', label: 'Multi Purpose', icon: '🪑',
        x: 19, y: 57, // pin: center of the terracotta sofa area
        inventory: [
            { id: 'floor', icon: '🪵', label: 'Flooring', box: { left: 3, top: 43, width: 26, height: 27 }, materials: [{ label: 'Choose material', options: FLOOR }] },
            { id: 'wall', icon: '🎨', label: 'Wall Paint', box: { left: 3, top: 43, width: 26, height: 27 }, materials: [{ label: 'Choose color', options: WALL }] },
            { id: 'sofa-l', icon: '🛋️', label: 'L-Shape Sofa (Left)', box: { left: 6, top: 43, width: 12, height: 22 }, materials: [{ label: 'Upholstery', options: SOFA }] },
            { id: 'sofa-r', icon: '🛋️', label: 'Armchairs (Right)', box: { left: 16, top: 47, width: 10, height: 18 }, materials: [{ label: 'Upholstery', options: SOFA }] },
            { id: 'tv-mp', icon: '📺', label: 'TV Unit', box: { left: 26, top: 62, width: 5, height: 5 }, materials: [{ label: 'Cabinet finish', options: WOOD }] },
        ]
    },
    {
        id: 'drawing', label: 'Drawing Room', icon: '🪑',
        x: 27, y: 82,
        inventory: [
            { id: 'floor', icon: '🪵', label: 'Flooring', box: { left: 14, top: 71, width: 22, height: 27 }, materials: [{ label: 'Choose material', options: FLOOR }] },
            { id: 'wall', icon: '🎨', label: 'Wall Paint', box: { left: 14, top: 71, width: 22, height: 27 }, materials: [{ label: 'Choose color', options: WALL }] },
            { id: 'sofa', icon: '🛋️', label: 'Drawing Sofa', box: { left: 19, top: 72, width: 16, height: 22 }, materials: [{ label: 'Upholstery', options: SOFA }] },
        ]
    },
    {
        id: 'bed3', label: 'Bedroom 3', icon: '🛏️',
        x: 82, y: 79,
        inventory: [
            { id: 'floor', icon: '🪵', label: 'Flooring', box: { left: 64, top: 65, width: 34, height: 33 }, materials: [{ label: 'Choose material', options: FLOOR }] },
            { id: 'wall', icon: '🎨', label: 'Wall Paint', box: { left: 64, top: 65, width: 34, height: 33 }, materials: [{ label: 'Choose color', options: WALL }] },
            { id: 'bed', icon: '🛏️', label: 'Bed & Headboard', box: { left: 67, top: 67, width: 24, height: 22 }, materials: [{ label: 'Bed frame finish', options: WOOD }] },
            { id: 'wardrobe', icon: '🪞', label: 'Wardrobe', box: { left: 67, top: 91, width: 28, height: 6 }, materials: [{ label: 'Door finish', options: [...WOOD, { id: 'mirror', label: 'Mirror', color: '#c9d8e0' }] }] },
        ]
    },
    {
        id: 'bed4', label: 'Bedroom 4', icon: '🛏️',
        x: 54, y: 82,
        inventory: [
            { id: 'floor', icon: '🪵', label: 'Flooring', box: { left: 38, top: 70, width: 25, height: 28 }, materials: [{ label: 'Choose material', options: FLOOR }] },
            { id: 'wall', icon: '🎨', label: 'Wall Paint', box: { left: 38, top: 70, width: 25, height: 28 }, materials: [{ label: 'Choose color', options: WALL }] },
            { id: 'bed', icon: '🛏️', label: 'Bed', box: { left: 41, top: 72, width: 18, height: 20 }, materials: [{ label: 'Bed frame finish', options: WOOD }] },
        ]
    },
    {
        id: 'sitout', label: 'Sit Out', icon: '🌿',
        x: 94, y: 52,
        inventory: [
            { id: 'floor', icon: '🪵', label: 'Deck Flooring', box: { left: 86, top: 40, width: 12, height: 28 }, materials: [{ label: 'Outdoor material', options: [{ id: 'teak', label: 'Teak Deck', color: '#9b6a3b' }, { id: 'stone', label: 'Slate Stone', color: '#c8c0b8' }, { id: 'tile', label: 'Outdoor Tile', color: '#ccc8c0' }] }] },
        ]
    },
];

// ─── Pin Overlay (outside TransformComponent to receive clicks) ──────────────
function PinLayer({ selectedId, onPin }: { selectedId: string | null; onPin: (room: Room) => void }) {
    const ctx = useTransformContext();

    return (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
            {ROOMS.map(room => {
                const { positionX, positionY, scale } = ctx.transformState;
                const pinX = positionX + (room.x / 100) * 1118 * scale;
                const pinY = positionY + (room.y / 100) * 834 * scale;
                const isSelected = selectedId === room.id;
                return (
                    <button key={room.id}
                        className="absolute pointer-events-auto"
                        style={{ left: pinX, top: pinY, transform: 'translate(-50%, -50%)', zIndex: 20 }}
                        onClick={() => onPin(room)}
                    >
                        {isSelected && <span className="absolute inset-0 rounded-full animate-ping opacity-50 bg-amber-400" />}
                        <span className="relative flex items-center justify-center w-8 h-8 rounded-full text-sm shadow-xl border-2 transition-all hover:scale-110"
                            style={{
                                backgroundColor: isSelected ? '#f59e0b' : '#1c639ecc',
                                borderColor: isSelected ? '#fcd34d' : 'rgba(255,255,255,0.35)',
                            }}>
                            {room.icon}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

interface SpatialViewerProps {
    backgroundImage?: string;
    onAssetClick?: (assetId: string, assetType: string) => void;
}

export default function SpatialViewer({ backgroundImage = '/floor_plan_ai.jpg', onAssetClick }: SpatialViewerProps) {
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [selectedItem, setSelectedItem] = useState<FurnitureItem | null>(null);
    const [overlays, setOverlays] = useState<Overlay[]>([]);
    const [showPins, setShowPins] = useState(true);

    const handlePin = (room: Room) => {
        setSelectedRoom(r => r?.id === room.id ? null : room);
        setSelectedItem(null);
        if (onAssetClick) onAssetClick(room.id, 'room');
    };

    const applyMaterial = (room: Room, item: FurnitureItem, mat: Material) => {
        const key = `${room.id}::${item.id}`;
        setOverlays(prev => {
            const filtered = prev.filter(o => o.itemKey !== key);
            // Opacity tuning by item type
            const opacity =
                item.id === 'floor' ? 0.42
                : item.id === 'wall' ? 0.28
                : item.id === 'curtains' ? 0.55
                : item.id === 'wardrobe' ? 0.48
                : item.id.includes('sofa') || item.id.includes('Sofa') ? 0.55
                : item.id === 'bed' ? 0.45
                : 0.40;
            return [...filtered, { itemKey: key, color: mat.color, opacity, box: item.box }];
        });
    };

    const getActiveForItem = (roomId: string, itemId: string) =>
        overlays.find(o => o.itemKey === `${roomId}::${itemId}`);

    return (
        <div className="relative w-full bg-[#111] rounded-2xl overflow-hidden shadow-2xl border border-white/5">
            {/* Floor Plan Viewer */}
            <div className="relative w-full" style={{ height: '65vw', maxHeight: 520 }}>
                <TransformWrapper
                    initialScale={1} minScale={0.3} maxScale={8}
                    centerOnInit wheel={{ step: 0.08 }} pinch={{ step: 5 }}
                    panning={{ velocityDisabled: false }}
                >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                        <>
                            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                                <div style={{ width: 1118, height: 834, position: 'relative' }}>
                                    <img
                                        src={backgroundImage} alt="Floor Plan"
                                        style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', userSelect: 'none' }}
                                        draggable={false}
                                    />
                                    {/* Color overlays — per furniture item */}
                                    {overlays.map(ov => (
                                        <div key={ov.itemKey}
                                            className="absolute pointer-events-none transition-all duration-500"
                                            style={{
                                                left: `${ov.box.left}%`, top: `${ov.box.top}%`,
                                                width: `${ov.box.width}%`, height: `${ov.box.height}%`,
                                                backgroundColor: ov.color, opacity: ov.opacity,
                                                mixBlendMode: 'multiply', borderRadius: 3,
                                            }}
                                        />
                                    ))}
                                </div>
                            </TransformComponent>

                            {showPins && <PinLayer selectedId={selectedRoom?.id ?? null} onPin={handlePin} />}

                            {/* Zoom Controls */}
                            <div className="absolute bottom-3 right-3 z-30 flex gap-1 bg-black/60 backdrop-blur-sm p-1 rounded-xl border border-white/10">
                                <button onClick={() => zoomIn()} className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-all"><Maximize2 size={14} /></button>
                                <button onClick={() => zoomOut()} className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-all"><Minimize2 size={14} /></button>
                                <button onClick={() => resetTransform()} className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-all"><RefreshCw size={14} /></button>
                                <button onClick={() => setShowPins(p => !p)} title={showPins ? 'Hide pins' : 'Show pins'} className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-all"><Layers size={14} /></button>
                            </div>
                        </>
                    )}
                </TransformWrapper>
            </div>

            {/* ── Room Inventory Panel ── */}
            {selectedRoom && !selectedItem && (
                <div className="border-t border-white/10 bg-[#0d0d0d] max-h-72 overflow-y-auto" style={{ animation: 'slideUp .2s ease-out' }}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 sticky top-0 bg-[#0d0d0d]">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{selectedRoom.icon}</span>
                            <span className="font-bold text-white text-sm">{selectedRoom.label}</span>
                            <span className="text-[11px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{selectedRoom.inventory.length} items</span>
                        </div>
                        <button onClick={() => setSelectedRoom(null)} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                            <X size={12} className="text-white/60" />
                        </button>
                    </div>
                    <div className="px-4 py-2 flex flex-col gap-0.5">
                        {selectedRoom.inventory.map(item => {
                            const active = getActiveForItem(selectedRoom.id, item.id);
                            const activeMat = active ? item.materials[0].options.find(o => o.color === active.color) : null;
                            return (
                                <button key={item.id}
                                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all text-left w-full"
                                    onClick={() => setSelectedItem(item)}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{item.icon}</span>
                                        <span className="text-sm text-white/80 font-medium">{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {active && <span className="w-4 h-4 rounded-full border border-white/30 flex-shrink-0" style={{ backgroundColor: active.color }} />}
                                        <span className="text-xs text-white/30 whitespace-nowrap">{activeMat ? activeMat.label : 'Tap to change'}</span>
                                        <ChevronLeft size={12} className="text-white/20 rotate-180 flex-shrink-0" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Material Picker ── */}
            {selectedRoom && selectedItem && (
                <div className="border-t border-white/10 bg-[#0d0d0d]" style={{ animation: 'slideUp .18s ease-out' }}>
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                        <button onClick={() => setSelectedItem(null)} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                            <ChevronLeft size={12} className="text-white/60" />
                        </button>
                        <span className="text-lg">{selectedItem.icon}</span>
                        <div>
                            <span className="font-bold text-white text-sm">{selectedItem.label}</span>
                            <span className="text-xs text-white/30 ml-2">{selectedRoom.label}</span>
                        </div>
                    </div>
                    {selectedItem.materials.map(section => (
                        <div key={section.label} className="px-4 py-3">
                            <p className="text-[11px] text-white/30 uppercase tracking-widest mb-2">{section.label}</p>
                            <div className="grid grid-cols-3 gap-2">
                                {section.options.map(mat => {
                                    const isActive = overlays.some(o => o.itemKey === `${selectedRoom.id}::${selectedItem.id}` && o.color === mat.color);
                                    return (
                                        <button key={mat.id}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${isActive ? 'ring-2 ring-amber-400 scale-105' : 'hover:scale-[1.02]'}`}
                                            style={{ backgroundColor: mat.color + '18', border: `1px solid ${mat.color}50` }}
                                            onClick={() => applyMaterial(selectedRoom, selectedItem, mat)}
                                        >
                                            <span className="w-4 h-4 rounded-full flex-shrink-0 border border-white/20" style={{ backgroundColor: mat.color }} />
                                            <span style={{ color: isActive ? '#fcd34d' : 'rgba(255,255,255,0.75)' }}>{mat.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx global>{`
                @keyframes slideUp { from { transform: translateY(6px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
}
