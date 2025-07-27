import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { characters } from './RapBattle';
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
          <h2> { character.name } </h2>
          <img src={character.image} alt={character.name} />
          <p> { character.hint } </p>
          <button onClick={onClick} disabled={disabled}>
            {isSelected ? 'Selected' : 'Select'}
          </button>
        </div>
    )
}