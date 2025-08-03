import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Character } from '@/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface CharacterCardProps {
    character: Character;
    isSelected: boolean;
    disabled: boolean;
    onClick: () => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
    character,
    isSelected,
    disabled,
    onClick }) => {
    return (
        <div
            className={cn(
                "w-full h-auto flex flex-col items-center justify-center text-center gap-2 cursor-pointer p-2 rounded-lg",
                "transition-all duration-300",
                isSelected ? "opacity-100 scale-105" : "opacity-70 hover:opacity-100",
                disabled && "pointer-events-none opacity-40 grayscale"
            )}
            onClick={disabled ? undefined : onClick}
        >
            <Avatar className={cn(
                "w-16 h-16 md:w-20 md:h-20 border-2",
                isSelected ? "border-primary" : "border-transparent"
            )}>
                <AvatarImage src={character.image} alt={character.name} className="rounded-full object-cover" />
                <AvatarFallback>{character.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="font-semibold text-sm">{character.name}</p>
        </div>
    );
};
