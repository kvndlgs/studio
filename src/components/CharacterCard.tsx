import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { Character } from '../types';

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
        <div className={`border-2 border-transparent ${isSelected ? 'border-orange' : ''}`}>
                <div className="flex flex-col items-around justify-center">
                  <Avatar>
                    <AvatarImage src={character.image} />
                    <AvatarFallback>
                      {character.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                    <h3> { character.name } </h3>
                </div>
        </div>
    )
}