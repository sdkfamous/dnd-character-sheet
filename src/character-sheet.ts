// Character Sheet Data Interface
interface CharacterData {
    // Basic Info
    characterName: string;
    playerName: string;
    race: string;
    class: string;
    level: number;
    background: string;
    alignment: string;
    experience: number;

    // Ability Scores
    abilities: {
        str: number;
        dex: number;
        con: number;
        int: number;
        wis: number;
        cha: number;
    };

    // Saving Throw Proficiencies
    savingThrows: {
        str: boolean;
        dex: boolean;
        con: boolean;
        int: boolean;
        wis: boolean;
        cha: boolean;
    };

    // Combat Stats
    armorClass: number;
    initiative: number;
    speed: number;
    hitPointsMax: number;
    hitPointsCurrent: number;
    hitPointsTemp: number;
    hitDice: string;
    deathSaves: {
        success: boolean[];
        failure: boolean[];
    };

    // Skills (proficiency flags)
    skills: {
        athletics: boolean;
        acrobatics: boolean;
        sleight: boolean;
        stealth: boolean;
        arcana: boolean;
        history: boolean;
        investigation: boolean;
        nature: boolean;
        religion: boolean;
        animal: boolean;
        insight: boolean;
        medicine: boolean;
        perception: boolean;
        survival: boolean;
        deception: boolean;
        intimidation: boolean;
        performance: boolean;
        persuasion: boolean;
    };

    // Features & Spells
    features: string;
    spellcastingAbility: string;
    spellSaveDC: number;
    spellAttackBonus: number;
    spellSlots: {
        level1: { current: number; max: number };
        level2: { current: number; max: number };
    };
    knownSpells: string;

    // Equipment & Notes
    equipment: string;
    notes: string;
}

class CharacterSheet {
    private data: CharacterData;
    private saveTimeout: number | null = null;
    private readonly STORAGE_KEY = 'dnd-character-sheet';

    constructor() {
        this.data = this.loadData();
        this.initializeEventListeners();
        this.updateAll();
    }

    private loadData(): CharacterData {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
        return this.getDefaultData();
    }

    private getDefaultData(): CharacterData {
        return {
            characterName: '',
            playerName: '',
            race: '',
            class: 'Fighter (Eldritch Knight)',
            level: 5,
            background: '',
            alignment: '',
            experience: 0,
            abilities: {
                str: 16,
                dex: 12,
                con: 16,
                int: 13,
                wis: 10,
                cha: 8
            },
            savingThrows: {
                str: false,
                dex: false,
                con: true, // Fighter proficiency
                int: false,
                wis: false,
                cha: false
            },
            armorClass: 18,
            initiative: 1,
            speed: 30,
            hitPointsMax: 44,
            hitPointsCurrent: 44,
            hitPointsTemp: 0,
            hitDice: '5d10',
            deathSaves: {
                success: [false, false, false],
                failure: [false, false, false]
            },
            skills: {
                athletics: false,
                acrobatics: false,
                sleight: false,
                stealth: false,
                arcana: false,
                history: false,
                investigation: false,
                nature: false,
                religion: false,
                animal: false,
                insight: false,
                medicine: false,
                perception: false,
                survival: false,
                deception: false,
                intimidation: false,
                performance: false,
                persuasion: false
            },
            features: '',
            spellcastingAbility: 'Intelligence',
            spellSaveDC: 13,
            spellAttackBonus: 4,
            spellSlots: {
                level1: { current: 2, max: 2 },
                level2: { current: 0, max: 0 }
            },
            knownSpells: '',
            equipment: '',
            notes: ''
        };
    }

    private initializeEventListeners(): void {
        // Basic Info
        this.addInputListener('characterName', (v) => this.data.characterName = v);
        this.addInputListener('playerName', (v) => this.data.playerName = v);
        this.addInputListener('race', (v) => this.data.race = v);
        this.addInputListener('level', (v) => {
            this.data.level = parseInt(v) || 5;
            this.updateProficiencyBonus();
        });
        this.addInputListener('background', (v) => this.data.background = v);
        this.addInputListener('alignment', (v) => this.data.alignment = v);
        this.addInputListener('experience', (v) => this.data.experience = parseInt(v) || 0);

        // Ability Scores
        this.addInputListener('strScore', (v) => {
            this.data.abilities.str = parseInt(v) || 10;
            this.updateModifiers();
        });
        this.addInputListener('dexScore', (v) => {
            this.data.abilities.dex = parseInt(v) || 10;
            this.updateModifiers();
        });
        this.addInputListener('conScore', (v) => {
            this.data.abilities.con = parseInt(v) || 10;
            this.updateModifiers();
        });
        this.addInputListener('intScore', (v) => {
            this.data.abilities.int = parseInt(v) || 10;
            this.updateModifiers();
            this.updateSpellStats();
        });
        this.addInputListener('wisScore', (v) => {
            this.data.abilities.wis = parseInt(v) || 10;
            this.updateModifiers();
        });
        this.addInputListener('chaScore', (v) => {
            this.data.abilities.cha = parseInt(v) || 10;
            this.updateModifiers();
        });

        // Saving Throws
        this.addCheckboxListener('strSaveProf', (v) => this.data.savingThrows.str = v);
        this.addCheckboxListener('dexSaveProf', (v) => this.data.savingThrows.dex = v);
        this.addCheckboxListener('conSaveProf', (v) => this.data.savingThrows.con = v);
        this.addCheckboxListener('intSaveProf', (v) => this.data.savingThrows.int = v);
        this.addCheckboxListener('wisSaveProf', (v) => this.data.savingThrows.wis = v);
        this.addCheckboxListener('chaSaveProf', (v) => this.data.savingThrows.cha = v);

        // Combat Stats
        this.addInputListener('armorClass', (v) => this.data.armorClass = parseInt(v) || 10);
        this.addInputListener('initiative', (v) => this.data.initiative = parseInt(v) || 0);
        this.addInputListener('speed', (v) => this.data.speed = parseInt(v) || 30);
        this.addInputListener('hitPointsMax', (v) => this.data.hitPointsMax = parseInt(v) || 1);
        this.addInputListener('hitPointsCurrent', (v) => this.data.hitPointsCurrent = parseInt(v) || 0);
        this.addInputListener('hitPointsTemp', (v) => this.data.hitPointsTemp = parseInt(v) || 0);

        // Death Saves
        this.addCheckboxListener('deathSave1', (v) => this.data.deathSaves.success[0] = v);
        this.addCheckboxListener('deathSave2', (v) => this.data.deathSaves.success[1] = v);
        this.addCheckboxListener('deathSave3', (v) => this.data.deathSaves.success[2] = v);
        this.addCheckboxListener('deathFail1', (v) => this.data.deathSaves.failure[0] = v);
        this.addCheckboxListener('deathFail2', (v) => this.data.deathSaves.failure[1] = v);
        this.addCheckboxListener('deathFail3', (v) => this.data.deathSaves.failure[2] = v);

        // Skills
        const skillMap: { [key: string]: keyof CharacterData['skills'] } = {
            'skillAthletics': 'athletics',
            'skillAcrobatics': 'acrobatics',
            'skillSleight': 'sleight',
            'skillStealth': 'stealth',
            'skillArcana': 'arcana',
            'skillHistory': 'history',
            'skillInvestigation': 'investigation',
            'skillNature': 'nature',
            'skillReligion': 'religion',
            'skillAnimal': 'animal',
            'skillInsight': 'insight',
            'skillMedicine': 'medicine',
            'skillPerception': 'perception',
            'skillSurvival': 'survival',
            'skillDeception': 'deception',
            'skillIntimidation': 'intimidation',
            'skillPerformance': 'performance',
            'skillPersuasion': 'persuasion'
        };

        for (const [id, skill] of Object.entries(skillMap)) {
            this.addCheckboxListener(id, (v) => {
                this.data.skills[skill] = v;
                this.updateSkillModifiers();
            });
        }

        // Features & Spells
        this.addTextareaListener('features', (v) => this.data.features = v);
        this.addInputListener('spellSlots1', (v) => this.data.spellSlots.level1.current = parseInt(v) || 0);
        this.addInputListener('spellSlots2', (v) => this.data.spellSlots.level2.current = parseInt(v) || 0);
        this.addTextareaListener('knownSpells', (v) => this.data.knownSpells = v);

        // Equipment & Notes
        this.addTextareaListener('equipment', (v) => this.data.equipment = v);
        this.addTextareaListener('notes', (v) => this.data.notes = v);
    }

    private addInputListener(id: string, callback: (value: string) => void): void {
        const element = document.getElementById(id) as HTMLInputElement;
        if (element) {
            element.addEventListener('input', () => {
                callback(element.value);
                this.saveData();
            });
        }
    }

    private addTextareaListener(id: string, callback: (value: string) => void): void {
        const element = document.getElementById(id) as HTMLTextAreaElement;
        if (element) {
            element.addEventListener('input', () => {
                callback(element.value);
                this.saveData();
            });
        }
    }

    private addCheckboxListener(id: string, callback: (value: boolean) => void): void {
        const element = document.getElementById(id) as HTMLInputElement;
        if (element) {
            element.addEventListener('change', () => {
                callback(element.checked);
                this.updateModifiers();
                this.saveData();
            });
        }
    }

    private calculateModifier(score: number): number {
        return Math.floor((score - 10) / 2);
    }

    private getProficiencyBonus(): number {
        return Math.ceil(this.data.level / 4) + 1;
    }

    private updateProficiencyBonus(): void {
        // Update spell save DC and attack bonus based on level and INT
        const profBonus = this.getProficiencyBonus();
        const intMod = this.calculateModifier(this.data.abilities.int);
        this.data.spellSaveDC = 8 + profBonus + intMod;
        this.data.spellAttackBonus = profBonus + intMod;

        const spellSaveDC = document.getElementById('spellSaveDC') as HTMLInputElement;
        const spellAttackBonus = document.getElementById('spellAttackBonus') as HTMLInputElement;
        if (spellSaveDC) spellSaveDC.value = this.data.spellSaveDC.toString();
        if (spellAttackBonus) spellAttackBonus.value = `+${this.data.spellAttackBonus}`;
    }

    private updateModifiers(): void {
        // Update ability modifiers
        const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
        abilities.forEach(ability => {
            const score = this.data.abilities[ability];
            const modifier = this.calculateModifier(score);
            const modElement = document.getElementById(`${ability}Mod`) as HTMLElement;
            if (modElement) {
                modElement.textContent = modifier >= 0 ? `+${modifier}` : `${modifier}`;
            }
        });

        this.updateSkillModifiers();
        this.updateSpellStats();
    }

    private updateSkillModifiers(): void {
        const skillData: { [key: string]: { ability: keyof CharacterData['abilities'], id: string } } = {
            'athletics': { ability: 'str', id: 'skillAthleticsMod' },
            'acrobatics': { ability: 'dex', id: 'skillAcrobaticsMod' },
            'sleight': { ability: 'dex', id: 'skillSleightMod' },
            'stealth': { ability: 'dex', id: 'skillStealthMod' },
            'arcana': { ability: 'int', id: 'skillArcanaMod' },
            'history': { ability: 'int', id: 'skillHistoryMod' },
            'investigation': { ability: 'int', id: 'skillInvestigationMod' },
            'nature': { ability: 'int', id: 'skillNatureMod' },
            'religion': { ability: 'int', id: 'skillReligionMod' },
            'animal': { ability: 'wis', id: 'skillAnimalMod' },
            'insight': { ability: 'wis', id: 'skillInsightMod' },
            'medicine': { ability: 'wis', id: 'skillMedicineMod' },
            'perception': { ability: 'wis', id: 'skillPerceptionMod' },
            'survival': { ability: 'wis', id: 'skillSurvivalMod' },
            'deception': { ability: 'cha', id: 'skillDeceptionMod' },
            'intimidation': { ability: 'cha', id: 'skillIntimidationMod' },
            'performance': { ability: 'cha', id: 'skillPerformanceMod' },
            'persuasion': { ability: 'cha', id: 'skillPersuasionMod' }
        };

        const profBonus = this.getProficiencyBonus();

        for (const [skill, info] of Object.entries(skillData)) {
            const abilityMod = this.calculateModifier(this.data.abilities[info.ability]);
            const isProficient = this.data.skills[skill as keyof CharacterData['skills']];
            const totalMod = abilityMod + (isProficient ? profBonus : 0);
            const modElement = document.getElementById(info.id) as HTMLElement;
            if (modElement) {
                modElement.textContent = totalMod >= 0 ? `+${totalMod}` : `${totalMod}`;
            }
        }
    }

    private updateSpellStats(): void {
        this.updateProficiencyBonus();
    }

    private updateAll(): void {
        // Populate all fields with current data
        (document.getElementById('characterName') as HTMLInputElement).value = this.data.characterName;
        (document.getElementById('playerName') as HTMLInputElement).value = this.data.playerName;
        (document.getElementById('race') as HTMLInputElement).value = this.data.race;
        (document.getElementById('class') as HTMLInputElement).value = this.data.class;
        (document.getElementById('level') as HTMLInputElement).value = this.data.level.toString();
        (document.getElementById('background') as HTMLInputElement).value = this.data.background;
        (document.getElementById('alignment') as HTMLInputElement).value = this.data.alignment;
        (document.getElementById('experience') as HTMLInputElement).value = this.data.experience.toString();

        // Ability Scores
        (document.getElementById('strScore') as HTMLInputElement).value = this.data.abilities.str.toString();
        (document.getElementById('dexScore') as HTMLInputElement).value = this.data.abilities.dex.toString();
        (document.getElementById('conScore') as HTMLInputElement).value = this.data.abilities.con.toString();
        (document.getElementById('intScore') as HTMLInputElement).value = this.data.abilities.int.toString();
        (document.getElementById('wisScore') as HTMLInputElement).value = this.data.abilities.wis.toString();
        (document.getElementById('chaScore') as HTMLInputElement).value = this.data.abilities.cha.toString();

        // Saving Throws
        (document.getElementById('strSaveProf') as HTMLInputElement).checked = this.data.savingThrows.str;
        (document.getElementById('dexSaveProf') as HTMLInputElement).checked = this.data.savingThrows.dex;
        (document.getElementById('conSaveProf') as HTMLInputElement).checked = this.data.savingThrows.con;
        (document.getElementById('intSaveProf') as HTMLInputElement).checked = this.data.savingThrows.int;
        (document.getElementById('wisSaveProf') as HTMLInputElement).checked = this.data.savingThrows.wis;
        (document.getElementById('chaSaveProf') as HTMLInputElement).checked = this.data.savingThrows.cha;

        // Combat Stats
        (document.getElementById('armorClass') as HTMLInputElement).value = this.data.armorClass.toString();
        (document.getElementById('initiative') as HTMLInputElement).value = this.data.initiative.toString();
        (document.getElementById('speed') as HTMLInputElement).value = this.data.speed.toString();
        (document.getElementById('hitPointsMax') as HTMLInputElement).value = this.data.hitPointsMax.toString();
        (document.getElementById('hitPointsCurrent') as HTMLInputElement).value = this.data.hitPointsCurrent.toString();
        (document.getElementById('hitPointsTemp') as HTMLInputElement).value = this.data.hitPointsTemp.toString();

        // Death Saves
        (document.getElementById('deathSave1') as HTMLInputElement).checked = this.data.deathSaves.success[0];
        (document.getElementById('deathSave2') as HTMLInputElement).checked = this.data.deathSaves.success[1];
        (document.getElementById('deathSave3') as HTMLInputElement).checked = this.data.deathSaves.success[2];
        (document.getElementById('deathFail1') as HTMLInputElement).checked = this.data.deathSaves.failure[0];
        (document.getElementById('deathFail2') as HTMLInputElement).checked = this.data.deathSaves.failure[1];
        (document.getElementById('deathFail3') as HTMLInputElement).checked = this.data.deathSaves.failure[2];

        // Skills
        const skillCheckboxes: { [key: string]: keyof CharacterData['skills'] } = {
            'skillAthletics': 'athletics',
            'skillAcrobatics': 'acrobatics',
            'skillSleight': 'sleight',
            'skillStealth': 'stealth',
            'skillArcana': 'arcana',
            'skillHistory': 'history',
            'skillInvestigation': 'investigation',
            'skillNature': 'nature',
            'skillReligion': 'religion',
            'skillAnimal': 'animal',
            'skillInsight': 'insight',
            'skillMedicine': 'medicine',
            'skillPerception': 'perception',
            'skillSurvival': 'survival',
            'skillDeception': 'deception',
            'skillIntimidation': 'intimidation',
            'skillPerformance': 'performance',
            'skillPersuasion': 'persuasion'
        };

        for (const [id, skill] of Object.entries(skillCheckboxes)) {
            (document.getElementById(id) as HTMLInputElement).checked = this.data.skills[skill];
        }

        // Features & Spells
        (document.getElementById('features') as HTMLTextAreaElement).value = this.data.features;
        (document.getElementById('spellSaveDC') as HTMLInputElement).value = this.data.spellSaveDC.toString();
        (document.getElementById('spellAttackBonus') as HTMLInputElement).value = `+${this.data.spellAttackBonus}`;
        (document.getElementById('spellSlots1') as HTMLInputElement).value = this.data.spellSlots.level1.current.toString();
        (document.getElementById('spellSlots1Max') as HTMLInputElement).value = this.data.spellSlots.level1.max.toString();
        (document.getElementById('spellSlots2') as HTMLInputElement).value = this.data.spellSlots.level2.current.toString();
        (document.getElementById('spellSlots2Max') as HTMLInputElement).value = this.data.spellSlots.level2.max.toString();
        (document.getElementById('knownSpells') as HTMLTextAreaElement).value = this.data.knownSpells;

        // Equipment & Notes
        (document.getElementById('equipment') as HTMLTextAreaElement).value = this.data.equipment;
        (document.getElementById('notes') as HTMLTextAreaElement).value = this.data.notes;

        // Update calculated values
        this.updateModifiers();
        this.updateProficiencyBonus();
    }

    private saveData(): void {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.showSaveStatus('saving', 'Saving...');

        this.saveTimeout = window.setTimeout(() => {
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
                this.showSaveStatus('saved', 'Saved');
                setTimeout(() => {
                    const statusEl = document.getElementById('saveStatus');
                    if (statusEl) {
                        statusEl.textContent = '';
                        statusEl.className = 'save-status';
                    }
                }, 2000);
            } catch (e) {
                console.error('Error saving data:', e);
                this.showSaveStatus('error', 'Save failed');
            }
        }, 500);
    }

    private showSaveStatus(status: 'saving' | 'saved' | 'error', message: string): void {
        const statusEl = document.getElementById('saveStatus');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `save-status ${status}`;
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new CharacterSheet();
    });
} else {
    new CharacterSheet();
}
