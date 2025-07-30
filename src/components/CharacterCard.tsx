import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Character } from '../types';
import { cn } from '@/lib/utils';

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
                "w-full h-auto flex items-center gap-2 justify-around cursor-pointer",
                "transition-all duration-300",
                isSelected ? "opacity-100 scale-105" : "opacity-70 grayscale hover:opacity-100 hover:grayscale-0",
                disabled && "pointer-events-none opacity-50"
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
        </div>
    );
};
