// Type Definitions
type AbilityName = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
type AbilitySource = 'base' | 'race' | 'asi' | 'feat' | 'magic';

interface AbilityScoreBreakdown {
    base: number;
    race: number;
    asi: number;
    feat: number;
    magic: number;
}

interface AbilityScores {
    str: AbilityScoreBreakdown;
    dex: AbilityScoreBreakdown;
    con: AbilityScoreBreakdown;
    int: AbilityScoreBreakdown;
    wis: AbilityScoreBreakdown;
    cha: AbilityScoreBreakdown;
}

// Layout Data Interface
interface LayoutData {
    skillsWidth: number;
    weaponsWidth: number;
    proficienciesWidth: number;
    equipmentWidth: number;
}

// Layout Manager Class
class LayoutManager {
    private layout: LayoutData;
    private saveCallback: (() => void) | null = null;

    constructor(initialLayout?: LayoutData) {
        this.layout = initialLayout || this.getDefaultLayout();
        this.applyLayout();
        this.initializeResizeListeners();
    }

    getLayout(): LayoutData {
        return { ...this.layout };
    }

    setLayout(layout: LayoutData): void {
        this.layout = layout;
        this.applyLayout();
    }

    setSaveCallback(callback: () => void): void {
        this.saveCallback = callback;
    }

    private getDefaultLayout(): LayoutData {
        return {
            skillsWidth: 250,
            weaponsWidth: 0, // 0 means use default/auto
            proficienciesWidth: 0,
            equipmentWidth: 0
        };
    }

    private applyLayout(): void {
        const skillsSection = document.getElementById('skillsSection');
        if (skillsSection && this.layout.skillsWidth) {
            skillsSection.style.width = `${this.layout.skillsWidth}px`;
        }

        const weaponsSection = document.getElementById('weaponsSection');
        if (weaponsSection && this.layout.weaponsWidth) {
            weaponsSection.style.width = `${this.layout.weaponsWidth}px`;
        }

        const proficienciesSection = document.getElementById('proficienciesSection');
        if (proficienciesSection && this.layout.proficienciesWidth) {
            proficienciesSection.style.width = `${this.layout.proficienciesWidth}px`;
        }

        const equipmentSection = document.getElementById('equipmentSection');
        if (equipmentSection && this.layout.equipmentWidth) {
            equipmentSection.style.width = `${this.layout.equipmentWidth}px`;
        }
    }

    private initializeResizeListeners(): void {
        // Skills section
        const skillsSection = document.getElementById('skillsSection');
        if (skillsSection) {
            this.addResizeListener(skillsSection, () => {
                this.layout.skillsWidth = skillsSection.offsetWidth;
                this.saveLayout();
            });
        }

        // Weapons section
        const weaponsSection = document.getElementById('weaponsSection');
        if (weaponsSection) {
            this.addResizeListener(weaponsSection, () => {
                this.layout.weaponsWidth = weaponsSection.offsetWidth;
                this.saveLayout();
            });
        }

        // Proficiencies section
        const proficienciesSection = document.getElementById('proficienciesSection');
        if (proficienciesSection) {
            this.addResizeListener(proficienciesSection, () => {
                this.layout.proficienciesWidth = proficienciesSection.offsetWidth;
                this.saveLayout();
            });
        }

        // Equipment section
        const equipmentSection = document.getElementById('equipmentSection');
        if (equipmentSection) {
            this.addResizeListener(equipmentSection, () => {
                this.layout.equipmentWidth = equipmentSection.offsetWidth;
                this.saveLayout();
            });
        }
    }

    private addResizeListener(element: HTMLElement, callback: () => void): void {
        let lastWidth = element.offsetWidth;
        let isResizing = false;
        let resizeInterval: number | null = null;

        // Use ResizeObserver if available
        if (typeof ResizeObserver !== 'undefined') {
            const resizeObserver = new ResizeObserver(() => {
                const currentWidth = element.offsetWidth;
                if (currentWidth !== lastWidth) {
                    lastWidth = currentWidth;
                    callback();
                }
            });
            resizeObserver.observe(element);
        } else {
            // Fallback: poll during potential resize
            const checkResize = () => {
                const currentWidth = element.offsetWidth;
                if (currentWidth !== lastWidth) {
                    lastWidth = currentWidth;
                    callback();
                }
            };

            // Detect when user starts resizing (mouse down on resize handle area)
            element.addEventListener('mousedown', (e) => {
                const rect = element.getBoundingClientRect();
                const rightEdge = rect.right;
                const mouseX = e.clientX;
                // If mouse is within 10px of right edge, consider it a resize
                if (mouseX >= rightEdge - 10 && mouseX <= rightEdge + 10) {
                    isResizing = true;
                    resizeInterval = window.setInterval(checkResize, 100);
                }
            });

            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    if (resizeInterval) {
                        clearInterval(resizeInterval);
                        resizeInterval = null;
                    }
                    checkResize(); // Final check
                }
            });
        }
    }

    private saveLayout(): void {
        // Notify parent to save (will be handled by CharacterSheet)
        if (this.saveCallback) {
            this.saveCallback();
        }
    }
}

// Character Sheet Data Interface
interface DnDCharacterData {
    // Basic Info
    characterName: string;
    playerName: string;
    race: string;
    class: string;
    level: number;
    background: string;
    subclass: string;
    alignment: string;
    experience: number;

    // Ability Scores - broken down by source
    abilityScores: AbilityScores;

    // Ability Modifiers (auto-calculated, but editable)
    abilityModifiers: {
        str: string;
        dex: string;
        con: string;
        int: string;
        wis: string;
        cha: string;
    };

    // Calculated Stats (editable)
    proficiencyBonus: string;
    passivePerception: number;

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
    shield: boolean;
    initiative: number;
    speed: number;
    size: string;
    heroicInspiration: boolean;
    hitPointsMax: number;
    hitPointsCurrent: number;
    hitPointsTemp: number;
    hitDice: string;
    hitDiceSpent: number;
    deathSaves: {
        success: boolean[];
        failure: boolean[];
    };

    // Skills (dynamic list)
    skills: Array<{
        id: string;
        name: string;
        ability: AbilityName;
        proficient: boolean;
        modifier: string; // Editable modifier
    }>;

    // Weapons (dynamic list)
    weapons: Array<{
        id: string;
        name: string;
        atkBonus: string;
        damage: string;
        notes: string;
    }>;

    // Spells (dynamic list)
    spells: Array<{
        id: string;
        name: string;
        level: string;
        castingTime: string;
        concentration: string;
        range: string;
        material: string;
        notes: string;
    }>;

    // Features & Spells
    features: string;
    feats: string;
    speciesTraits: string;
    spellcastingAbility: string;
    spellSaveDC: number;
    spellAttackBonus: string;
    spellSlots: {
        level1: { current: number; max: number };
        level2: { current: number; max: number };
        level3: { current: number; max: number };
        level4: { current: number; max: number };
        level5: { current: number; max: number };
        level6: { current: number; max: number };
        level7: { current: number; max: number };
        level8: { current: number; max: number };
        level9: { current: number; max: number };
    };
    knownSpells: string;

    // Equipment & Proficiencies
    equipment: string;
    equipmentDetail: string;
    armorProficiencies: string;
    weaponProficiencies: string;
    toolProficiencies: string;
    languages: string;

    // Coins
    coins: {
        cp: number;
        sp: number;
        ep: number;
        gp: number;
        pp: number;
    };

    // Backstory & Appearance
    backstory: string;
    appearance: string;
    notes: string;
}

class CharacterSheet {
    private data: DnDCharacterData;
    private readonly STORAGE_KEY = 'dnd-character-sheet';
    private nextSkillId: number = 100;
    private nextWeaponId: number = 100;
    private nextSpellId: number = 100;
    private layoutManager: LayoutManager;

    // Undo/Redo functionality
    private history: DnDCharacterData[] = [];
    private historyIndex: number = -1;
    private readonly MAX_HISTORY = 50;
    private historyTimeout: number | null = null;

    constructor() {
        // Initialize layout manager first (will be updated with saved layout in loadData)
        this.layoutManager = new LayoutManager();
        this.layoutManager.setSaveCallback(() => {
            // Layout changed - trigger save if user wants to save
            // For now, we'll save layout when user clicks Save button
        });
        this.data = this.loadData();
        // Initialize history with current state
        this.pushHistory();
        this.initializeEventListeners();
        this.renderSkills();
        this.renderWeapons();
        this.renderSpells();
        this.updateAll();
        this.updateHistoryButtons();
    }

    private validateAndMigrateData(data: any): DnDCharacterData {
        try {
            // Validate structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data structure');
            }

            // Migrate old formats and merge with defaults
            return this.mergeWithDefaults(data);
        } catch (error) {
            console.error('Data validation failed:', error);
            this.showSaveStatus('error', 'Failed to validate character data');
            return this.getDefaultData();
        }
    }

    private loadData(): DnDCharacterData {
        // Try to load from localStorage first (for backward compatibility)
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                try {
                    const fileData = JSON.parse(saved);

                    // Handle both old format (direct data) and new format (with character-definition and sheet-layout)
                    let characterData: any;
                    let layoutData: LayoutData | undefined;

                    if (fileData['character-definition'] && fileData['sheet-layout']) {
                        // New format
                        characterData = fileData['character-definition'];
                        layoutData = fileData['sheet-layout'];
                    } else {
                        // Old format - just character data
                        characterData = fileData;
                    }

                    // Apply layout if available
                    if (layoutData) {
                        this.layoutManager.setLayout(layoutData);
                    }

                    // Migrate old skills format to new format
                    if (characterData.skills && !Array.isArray(characterData.skills)) {
                        const oldSkills = characterData.skills;
                        const skillNames: { [key: string]: string } = {
                            'athletics': 'Athletics',
                            'acrobatics': 'Acrobatics',
                            'sleight': 'Sleight of Hand',
                            'stealth': 'Stealth',
                            'arcana': 'Arcana',
                            'history': 'History',
                            'investigation': 'Investigation',
                            'nature': 'Nature',
                            'religion': 'Religion',
                            'animal': 'Animal Handling',
                            'insight': 'Insight',
                            'medicine': 'Medicine',
                            'perception': 'Perception',
                            'survival': 'Survival',
                            'deception': 'Deception',
                            'intimidation': 'Intimidation',
                            'performance': 'Performance',
                            'persuasion': 'Persuasion'
                        };
                        const abilityMap: { [key: string]: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha' } = {
                            'athletics': 'str',
                            'acrobatics': 'dex',
                            'sleight': 'dex',
                            'stealth': 'dex',
                            'arcana': 'int',
                            'history': 'int',
                            'investigation': 'int',
                            'nature': 'int',
                            'religion': 'int',
                            'animal': 'wis',
                            'insight': 'wis',
                            'medicine': 'wis',
                            'perception': 'wis',
                            'survival': 'wis',
                            'deception': 'cha',
                            'intimidation': 'cha',
                            'performance': 'cha',
                            'persuasion': 'cha'
                        };
                        characterData.skills = Object.entries(oldSkills).map(([key, proficient], index) => ({
                            id: (index + 1).toString(),
                            name: skillNames[key] || key,
                            ability: abilityMap[key] || 'str',
                            proficient: proficient as boolean,
                            modifier: '+0'
                        }));
                    }
                    // Ensure weapons array exists
                    if (!characterData.weapons || !Array.isArray(characterData.weapons)) {
                        characterData.weapons = [];
                    }
                    // Ensure spells array exists
                    if (!characterData.spells || !Array.isArray(characterData.spells)) {
                        characterData.spells = [];
                    }
                    // Validate and migrate data
                    return this.validateAndMigrateData(characterData);
                } catch (parseError) {
                    console.error('Error parsing saved data:', parseError);
                    this.showSaveStatus('error', 'Failed to parse saved character data');
                }
            }
        } catch (error) {
            console.error('Error loading character data:', error);
            this.showSaveStatus('error', 'Failed to load saved character');
        }
        return this.getDefaultData();
    }

    private mergeAbilityScores(defaultScores: any, savedScores: any): any {
        // Handle migration from old structure (single number per ability)
        if (savedScores && typeof savedScores.str === 'number') {
            // Old format - convert to new format
            const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
            const result: any = {};
            abilities.forEach(ability => {
                result[ability] = {
                    base: savedScores[ability] || 10,
                    race: 0,
                    asi: 0,
                    feat: 0,
                    magic: 0
                };
            });
            return result;
        }
        // New format - merge properly
        const result: any = {};
        const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
        abilities.forEach(ability => {
            result[ability] = {
                base: savedScores?.[ability]?.base ?? defaultScores[ability].base,
                race: savedScores?.[ability]?.race ?? defaultScores[ability].race,
                asi: savedScores?.[ability]?.asi ?? defaultScores[ability].asi,
                feat: savedScores?.[ability]?.feat ?? defaultScores[ability].feat,
                magic: savedScores?.[ability]?.magic ?? defaultScores[ability].magic
            };
        });
        return result;
    }

    private mergeWithDefaults(data: any): DnDCharacterData {
        const defaults = this.getDefaultData();
        // Helper to only include defined values
        const mergeDefined = (defaultVal: any, savedVal: any) => {
            return (savedVal !== undefined && savedVal !== null) ? savedVal : defaultVal;
        };

        return {
            ...defaults,
            // Only override defaults with defined values from saved data
            characterName: mergeDefined(defaults.characterName, data.characterName),
            playerName: mergeDefined(defaults.playerName, data.playerName),
            race: mergeDefined(defaults.race, data.race),
            class: mergeDefined(defaults.class, data.class),
            level: mergeDefined(defaults.level, data.level),
            background: mergeDefined(defaults.background, data.background),
            subclass: mergeDefined(defaults.subclass, data.subclass),
            alignment: mergeDefined(defaults.alignment, data.alignment),
            experience: mergeDefined(defaults.experience, data.experience),
            abilityScores: this.mergeAbilityScores(defaults.abilityScores, data.abilityScores || data.abilities),
            abilityModifiers: { ...defaults.abilityModifiers, ...(data.abilityModifiers || {}) },
            proficiencyBonus: mergeDefined(defaults.proficiencyBonus, data.proficiencyBonus),
            passivePerception: mergeDefined(defaults.passivePerception, data.passivePerception),
            savingThrows: { ...defaults.savingThrows, ...(data.savingThrows || {}) },
            armorClass: mergeDefined(defaults.armorClass, data.armorClass),
            shield: mergeDefined(defaults.shield, data.shield),
            initiative: mergeDefined(defaults.initiative, data.initiative),
            speed: mergeDefined(defaults.speed, data.speed),
            size: mergeDefined(defaults.size, data.size),
            heroicInspiration: mergeDefined(defaults.heroicInspiration, data.heroicInspiration),
            hitPointsMax: mergeDefined(defaults.hitPointsMax, data.hitPointsMax),
            hitPointsCurrent: mergeDefined(defaults.hitPointsCurrent, data.hitPointsCurrent),
            hitPointsTemp: mergeDefined(defaults.hitPointsTemp, data.hitPointsTemp),
            hitDice: mergeDefined(defaults.hitDice, data.hitDice),
            hitDiceSpent: mergeDefined(defaults.hitDiceSpent, data.hitDiceSpent),
            deathSaves: { ...defaults.deathSaves, ...(data.deathSaves || {}) },
            skills: data.skills || defaults.skills,
            weapons: data.weapons || defaults.weapons,
            spells: data.spells || defaults.spells,
            features: mergeDefined(defaults.features, data.features),
            feats: mergeDefined(defaults.feats, data.feats),
            speciesTraits: mergeDefined(defaults.speciesTraits, data.speciesTraits),
            spellcastingAbility: mergeDefined(defaults.spellcastingAbility, data.spellcastingAbility),
            spellSaveDC: mergeDefined(defaults.spellSaveDC, data.spellSaveDC),
            spellAttackBonus: mergeDefined(defaults.spellAttackBonus, data.spellAttackBonus),
            spellSlots: { ...defaults.spellSlots, ...(data.spellSlots || {}) },
            knownSpells: mergeDefined(defaults.knownSpells, data.knownSpells),
            equipment: mergeDefined(defaults.equipment, data.equipment),
            equipmentDetail: mergeDefined(defaults.equipmentDetail, data.equipmentDetail),
            armorProficiencies: mergeDefined(defaults.armorProficiencies, data.armorProficiencies),
            weaponProficiencies: mergeDefined(defaults.weaponProficiencies, data.weaponProficiencies),
            toolProficiencies: mergeDefined(defaults.toolProficiencies, data.toolProficiencies),
            languages: mergeDefined(defaults.languages, data.languages),
            coins: { ...defaults.coins, ...(data.coins || {}) },
            backstory: mergeDefined(defaults.backstory, data.backstory),
            appearance: mergeDefined(defaults.appearance, data.appearance),
            notes: mergeDefined(defaults.notes, data.notes)
        };
    }

    private getDefaultData(): DnDCharacterData {
        return {
            characterName: '',
            playerName: '',
            race: '',
            class: '',
            level: 1,
            background: '',
            subclass: '',
            alignment: '',
            experience: 0,
            abilityScores: {
                str: { base: 10, race: 0, asi: 0, feat: 0, magic: 0 },
                dex: { base: 10, race: 0, asi: 0, feat: 0, magic: 0 },
                con: { base: 10, race: 0, asi: 0, feat: 0, magic: 0 },
                int: { base: 10, race: 0, asi: 0, feat: 0, magic: 0 },
                wis: { base: 10, race: 0, asi: 0, feat: 0, magic: 0 },
                cha: { base: 10, race: 0, asi: 0, feat: 0, magic: 0 }
            } as AbilityScores,
            abilityModifiers: {
                str: '+0',
                dex: '+0',
                con: '+0',
                int: '+0',
                wis: '+0',
                cha: '+0'
            },
            proficiencyBonus: '+2',
            passivePerception: 10,
            savingThrows: {
                str: false,
                dex: false,
                con: true, // Fighter proficiency
                int: false,
                wis: false,
                cha: false
            },
            armorClass: 10,
            shield: false,
            initiative: 0,
            speed: 30,
            size: '',
            heroicInspiration: false,
            hitPointsMax: 0,
            hitPointsCurrent: 0,
            hitPointsTemp: 0,
            hitDice: '',
            hitDiceSpent: 0,
            deathSaves: {
                success: [false, false, false],
                failure: [false, false, false]
            },
            skills: [],
            weapons: [],
            spells: [],
            features: '',
            feats: '',
            speciesTraits: '',
            spellcastingAbility: '',
            spellSaveDC: 0,
            spellAttackBonus: '+0',
            spellSlots: {
                level1: { current: 0, max: 0 },
                level2: { current: 0, max: 0 },
                level3: { current: 0, max: 0 },
                level4: { current: 0, max: 0 },
                level5: { current: 0, max: 0 },
                level6: { current: 0, max: 0 },
                level7: { current: 0, max: 0 },
                level8: { current: 0, max: 0 },
                level9: { current: 0, max: 0 }
            },
            knownSpells: '',
            equipment: '',
            equipmentDetail: '',
            armorProficiencies: '',
            weaponProficiencies: '',
            toolProficiencies: '',
            languages: '',
            coins: {
                cp: 0,
                sp: 0,
                ep: 0,
                gp: 0,
                pp: 0
            },
            backstory: '',
            appearance: '',
            notes: ''
        };
    }

    private initializeEventListeners(): void {
        // Basic Info
        this.addInputListener('characterName', (v) => this.data.characterName = v);
        this.addInputListener('playerName', (v) => this.data.playerName = v);
        this.addInputListener('race', (v) => this.data.race = v);
        this.addInputListener('level', (v) => {
            this.data.level = this.validateLevel(parseInt(v) || 1);
        });
        this.addInputListener('background', (v) => this.data.background = v);
        this.addInputListener('subclass', (v) => this.data.subclass = v);
        this.addInputListener('alignment', (v) => this.data.alignment = v);
        this.addInputListener('experience', (v) => this.data.experience = parseInt(v) || 0);

        // Ability Scores - setup using helper function (reduces duplication)
        this.setupAbilityScoreListeners();

        // Saving Throws
        this.addCheckboxListener('strSaveProf', (v) => this.data.savingThrows.str = v);
        this.addCheckboxListener('dexSaveProf', (v) => this.data.savingThrows.dex = v);
        this.addCheckboxListener('conSaveProf', (v) => this.data.savingThrows.con = v);
        this.addCheckboxListener('intSaveProf', (v) => this.data.savingThrows.int = v);
        this.addCheckboxListener('wisSaveProf', (v) => this.data.savingThrows.wis = v);
        this.addCheckboxListener('chaSaveProf', (v) => this.data.savingThrows.cha = v);

        // Combat Stats
        this.addInputListener('armorClass', (v) => this.data.armorClass = parseInt(v) || 10);
        this.addCheckboxListener('shield', (v) => this.data.shield = v);
        this.addInputListener('initiative', (v) => this.data.initiative = parseInt(v) || 0);
        this.addInputListener('speed', (v) => this.data.speed = parseInt(v) || 30);
        this.addInputListener('size', (v) => this.data.size = v);
        this.addInputListener('proficiencyBonus', (v) => this.data.proficiencyBonus = v);
        this.addInputListener('passivePerception', (v) => this.data.passivePerception = parseInt(v) || 10);
        this.addCheckboxListener('heroicInspiration', (v) => this.data.heroicInspiration = v);
        this.addInputListener('hitPointsMax', (v) => this.data.hitPointsMax = parseInt(v) || 1);
        this.addInputListener('hitPointsCurrent', (v) => this.data.hitPointsCurrent = parseInt(v) || 0);
        this.addInputListener('hitPointsTemp', (v) => this.data.hitPointsTemp = parseInt(v) || 0);
        this.addInputListener('hitDiceSpent', (v) => this.data.hitDiceSpent = parseInt(v) || 0);
        this.addInputListener('hitDice', (v) => this.data.hitDice = v);

        // Death Saves
        this.addCheckboxListener('deathSave1', (v) => this.data.deathSaves.success[0] = v);
        this.addCheckboxListener('deathSave2', (v) => this.data.deathSaves.success[1] = v);
        this.addCheckboxListener('deathSave3', (v) => this.data.deathSaves.success[2] = v);
        this.addCheckboxListener('deathFail1', (v) => this.data.deathSaves.failure[0] = v);
        this.addCheckboxListener('deathFail2', (v) => this.data.deathSaves.failure[1] = v);
        this.addCheckboxListener('deathFail3', (v) => this.data.deathSaves.failure[2] = v);

        // Skills - handled dynamically
        const addSkillBtn = document.getElementById('addSkillBtn');
        if (addSkillBtn) {
            addSkillBtn.addEventListener('click', () => this.addSkill());
        }

        // Weapons - handled dynamically
        const addWeaponBtn = document.getElementById('addWeaponBtn');
        if (addWeaponBtn) {
            addWeaponBtn.addEventListener('click', () => this.addWeapon());
        }

        // Spells - handled dynamically
        const addSpellBtn = document.getElementById('addSpellBtn');
        if (addSpellBtn) {
            addSpellBtn.addEventListener('click', () => this.addSpell());
        }

        // Save button
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveData());
        }

        // Load button
        const loadBtn = document.getElementById('loadBtn');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.loadFromFile());
        }

        // Undo/Redo buttons
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undo());
        }

        const redoBtn = document.getElementById('redoBtn');
        if (redoBtn) {
            redoBtn.addEventListener('click', () => this.redo());
        }

        // Keyboard shortcuts for undo/redo
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                this.redo();
            }
        });

        // Features & Spells
        this.addTextareaListener('features', (v) => this.data.features = v);
        this.addTextareaListener('feats', (v) => this.data.feats = v);
        this.addTextareaListener('speciesTraits', (v) => this.data.speciesTraits = v);
        this.addInputListener('spellSlots1', (v) => this.data.spellSlots.level1.current = parseInt(v) || 0);
        this.addInputListener('spellSlots2', (v) => this.data.spellSlots.level2.current = parseInt(v) || 0);
        this.addInputListener('spellSlots3', (v) => this.data.spellSlots.level3.current = parseInt(v) || 0);
        this.addInputListener('spellSlots4', (v) => this.data.spellSlots.level4.current = parseInt(v) || 0);
        this.addInputListener('spellSlots5', (v) => this.data.spellSlots.level5.current = parseInt(v) || 0);
        this.addInputListener('spellSlots6', (v) => this.data.spellSlots.level6.current = parseInt(v) || 0);
        this.addInputListener('spellSlots7', (v) => this.data.spellSlots.level7.current = parseInt(v) || 0);
        this.addInputListener('spellSlots8', (v) => this.data.spellSlots.level8.current = parseInt(v) || 0);
        this.addInputListener('spellSlots9', (v) => this.data.spellSlots.level9.current = parseInt(v) || 0);
        this.addInputListener('spellSlots1Max', (v) => this.data.spellSlots.level1.max = parseInt(v) || 0);
        this.addInputListener('spellSlots2Max', (v) => this.data.spellSlots.level2.max = parseInt(v) || 0);
        this.addInputListener('spellSlots3Max', (v) => this.data.spellSlots.level3.max = parseInt(v) || 0);
        this.addInputListener('spellSlots4Max', (v) => this.data.spellSlots.level4.max = parseInt(v) || 0);
        this.addInputListener('spellSlots5Max', (v) => this.data.spellSlots.level5.max = parseInt(v) || 0);
        this.addInputListener('spellSlots6Max', (v) => this.data.spellSlots.level6.max = parseInt(v) || 0);
        this.addInputListener('spellSlots7Max', (v) => this.data.spellSlots.level7.max = parseInt(v) || 0);
        this.addInputListener('spellSlots8Max', (v) => this.data.spellSlots.level8.max = parseInt(v) || 0);
        this.addInputListener('spellSlots9Max', (v) => this.data.spellSlots.level9.max = parseInt(v) || 0);
        this.addInputListener('spellcastingAbility', (v) => this.data.spellcastingAbility = v);
        this.addInputListener('spellSaveDC', (v) => this.data.spellSaveDC = parseInt(v) || 0);
        this.addInputListener('spellAttackBonus', (v) => this.data.spellAttackBonus = v);
        this.addTextareaListener('knownSpells', (v) => this.data.knownSpells = v);

        // Equipment & Proficiencies
        this.addTextareaListener('equipment', (v) => this.data.equipment = v);
        this.addTextareaListener('equipmentDetail', (v) => this.data.equipmentDetail = v);
        this.addTextareaListener('armorProficiencies', (v) => this.data.armorProficiencies = v);
        this.addTextareaListener('weaponProficiencies', (v) => this.data.weaponProficiencies = v);
        this.addTextareaListener('toolProficiencies', (v) => this.data.toolProficiencies = v);
        this.addTextareaListener('languages', (v) => {
            this.data.languages = v;
            // Sync with page 2 languages field
            const languagesPage2 = document.getElementById('languagesPage2') as HTMLTextAreaElement;
            if (languagesPage2) languagesPage2.value = v;
        });
        this.addTextareaListener('languagesPage2', (v) => {
            this.data.languages = v;
            // Sync with page 1 languages field
            const languages = document.getElementById('languages') as HTMLTextAreaElement;
            if (languages) languages.value = v;
        });

        // Coins
        this.addInputListener('coinCP', (v) => this.data.coins.cp = parseInt(v) || 0);
        this.addInputListener('coinSP', (v) => this.data.coins.sp = parseInt(v) || 0);
        this.addInputListener('coinEP', (v) => this.data.coins.ep = parseInt(v) || 0);
        this.addInputListener('coinGP', (v) => this.data.coins.gp = parseInt(v) || 0);
        this.addInputListener('coinPP', (v) => this.data.coins.pp = parseInt(v) || 0);

        // Backstory & Appearance
        this.addTextareaListener('backstory', (v) => this.data.backstory = v);
        this.addTextareaListener('appearance', (v) => this.data.appearance = v);
        this.addTextareaListener('notes', (v) => this.data.notes = v);
    }

    private addInputListener(id: string, callback: (value: string) => void): void {
        const element = document.getElementById(id) as HTMLInputElement;
        if (element) {
            element.addEventListener('input', () => {
                callback(element.value);
                // Push to history for undo/redo (debounced)
                this.debouncedPushHistory();
            });
        }
    }

    private calculateAbilityModifier(score: number): string {
        // D&D 2024 rules: modifier = (score - 10) / 2, rounded down
        const modifier = Math.floor((score - 10) / 2);
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    }

    private calculateTotalAbilityScore(ability: AbilityName): number {
        const scores = this.data.abilityScores[ability];
        const total = scores.base + scores.race + scores.asi + scores.feat + scores.magic;
        return this.validateAbilityScore(total);
    }

    private updateAbilityScore(ability: AbilityName): void {
        const total = this.calculateTotalAbilityScore(ability);
        const modifier = this.calculateAbilityModifier(total);

        // Update total display
        const totalEl = document.getElementById(`${ability}Total`);
        if (totalEl) {
            totalEl.textContent = total.toString();
        }

        // Update modifier (auto-calculated, but field is still editable)
        const modEl = document.getElementById(`${ability}Mod`) as HTMLInputElement;
        if (modEl) {
            modEl.value = modifier;
            this.data.abilityModifiers[ability] = modifier;
        }
    }

    private addTextareaListener(id: string, callback: (value: string) => void): void {
        const element = document.getElementById(id) as HTMLTextAreaElement;
        if (element) {
            element.addEventListener('input', () => {
                callback(element.value);
                this.debouncedPushHistory();
            });
            // Also listen to blur to catch any changes
            element.addEventListener('blur', () => {
                callback(element.value);
                this.debouncedPushHistory();
            });
        }
    }

    private addCheckboxListener(id: string, callback: (value: boolean) => void): void {
        const element = document.getElementById(id) as HTMLInputElement;
        if (element) {
            element.addEventListener('change', () => {
                callback(element.checked);
                this.debouncedPushHistory();
            });
        }
    }

    // Validation functions
    private validateAbilityScore(value: number): number {
        return Math.max(1, Math.min(30, value)); // D&D 2024 caps at 30
    }

    private validateLevel(level: number): number {
        return Math.max(1, Math.min(20, level));
    }

    private validateAbilityModifier(value: number): number {
        // Modifiers can go negative, but typically -5 to +10
        return Math.max(-5, Math.min(10, value));
    }

    // Undo/Redo methods
    private pushHistory(): void {
        // Remove any history after current index (if user undid, then made new change)
        this.history = this.history.slice(0, this.historyIndex + 1);

        // Add current state
        const stateCopy = JSON.parse(JSON.stringify(this.data));
        this.history.push(stateCopy);
        this.historyIndex++;

        // Limit history size
        if (this.history.length > this.MAX_HISTORY) {
            this.history.shift();
            this.historyIndex--;
        }

        // Update undo/redo button states
        this.updateHistoryButtons();
    }

    private undo(): void {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.data = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.updateAll();
            this.updateHistoryButtons();
        }
    }

    private redo(): void {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.data = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.updateAll();
            this.updateHistoryButtons();
        }
    }

    private updateHistoryButtons(): void {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');

        if (undoBtn) {
            undoBtn.classList.toggle('disabled', this.historyIndex <= 0);
            (undoBtn as HTMLButtonElement).disabled = this.historyIndex <= 0;
        }

        if (redoBtn) {
            redoBtn.classList.toggle('disabled', this.historyIndex >= this.history.length - 1);
            (redoBtn as HTMLButtonElement).disabled = this.historyIndex >= this.history.length - 1;
        }
    }

    // Debounced history push (to avoid too many history entries)
    private debouncedPushHistory(): void {
        if (this.historyTimeout) {
            clearTimeout(this.historyTimeout);
        }
        this.historyTimeout = window.setTimeout(() => {
            this.pushHistory();
        }, 500);
    }

    // Setup ability score listeners (reduces code duplication)
    private setupAbilityScoreListeners(): void {
        const abilities: AbilityName[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        const sources: AbilitySource[] = ['base', 'race', 'asi', 'feat', 'magic'];

        abilities.forEach(ability => {
            sources.forEach(source => {
                // Capitalize first letter for field name (e.g., 'base' -> 'Base')
                const fieldName = `${ability}${source.charAt(0).toUpperCase() + source.slice(1)}`;
                this.addInputListener(fieldName, (v) => {
                    // Base has default of 10, others default to 0
                    const defaultValue = source === 'base' ? 10 : 0;
                    const value = this.validateAbilityScore(parseInt(v) || defaultValue);
                    this.data.abilityScores[ability][source] = value;
                    this.updateAbilityScore(ability);
                    this.debouncedPushHistory();
                });
            });

            // Modifier listeners (editable but auto-calculated)
            this.addInputListener(`${ability}Mod`, (v) => {
                this.data.abilityModifiers[ability] = v;
                this.debouncedPushHistory();
            });
        });
    }


    private updateAll(): void {
        // Populate all fields with current data
        const characterName = document.getElementById('characterName') as HTMLInputElement;
        if (characterName) characterName.value = this.data.characterName;

        const playerName = document.getElementById('playerName') as HTMLInputElement;
        if (playerName) playerName.value = this.data.playerName;

        const race = document.getElementById('race') as HTMLInputElement;
        if (race) race.value = this.data.race;

        const classEl = document.getElementById('class') as HTMLInputElement;
        if (classEl) classEl.value = this.data.class;

        const level = document.getElementById('level') as HTMLInputElement;
        if (level) level.value = this.data.level.toString();

        const background = document.getElementById('background') as HTMLInputElement;
        if (background) background.value = this.data.background;

        const subclass = document.getElementById('subclass') as HTMLInputElement;
        if (subclass) subclass.value = this.data.subclass || '';

        const alignment = document.getElementById('alignment') as HTMLInputElement;
        if (alignment) alignment.value = this.data.alignment;

        const experience = document.getElementById('experience') as HTMLInputElement;
        if (experience) experience.value = this.data.experience.toString();

        // Ability Scores - populate all fields and calculate totals/modifiers
        const abilities: AbilityName[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        abilities.forEach(ability => {
            const scores = this.data.abilityScores[ability];

            // Populate individual fields
            const baseEl = document.getElementById(`${ability}Base`) as HTMLInputElement;
            if (baseEl) baseEl.value = scores.base.toString();
            const raceEl = document.getElementById(`${ability}Race`) as HTMLInputElement;
            if (raceEl) raceEl.value = scores.race.toString();
            const asiEl = document.getElementById(`${ability}ASI`) as HTMLInputElement;
            if (asiEl) asiEl.value = scores.asi.toString();
            const featEl = document.getElementById(`${ability}Feat`) as HTMLInputElement;
            if (featEl) featEl.value = scores.feat.toString();
            const magicEl = document.getElementById(`${ability}Magic`) as HTMLInputElement;
            if (magicEl) magicEl.value = scores.magic.toString();

            // Calculate and display total
            this.updateAbilityScore(ability);
        });

        // Saving Throws
        const strSaveProf = document.getElementById('strSaveProf') as HTMLInputElement;
        if (strSaveProf) strSaveProf.checked = this.data.savingThrows.str;
        const dexSaveProf = document.getElementById('dexSaveProf') as HTMLInputElement;
        if (dexSaveProf) dexSaveProf.checked = this.data.savingThrows.dex;
        const conSaveProf = document.getElementById('conSaveProf') as HTMLInputElement;
        if (conSaveProf) conSaveProf.checked = this.data.savingThrows.con;
        const intSaveProf = document.getElementById('intSaveProf') as HTMLInputElement;
        if (intSaveProf) intSaveProf.checked = this.data.savingThrows.int;
        const wisSaveProf = document.getElementById('wisSaveProf') as HTMLInputElement;
        if (wisSaveProf) wisSaveProf.checked = this.data.savingThrows.wis;
        const chaSaveProf = document.getElementById('chaSaveProf') as HTMLInputElement;
        if (chaSaveProf) chaSaveProf.checked = this.data.savingThrows.cha;

        // Combat Stats
        const armorClass = document.getElementById('armorClass') as HTMLInputElement;
        if (armorClass) armorClass.value = this.data.armorClass.toString();
        const shield = document.getElementById('shield') as HTMLInputElement;
        if (shield) shield.checked = this.data.shield || false;
        const initiative = document.getElementById('initiative') as HTMLInputElement;
        if (initiative) initiative.value = this.data.initiative.toString();
        const speed = document.getElementById('speed') as HTMLInputElement;
        if (speed) speed.value = this.data.speed.toString();
        const size = document.getElementById('size') as HTMLInputElement;
        if (size) size.value = this.data.size || '';
        const proficiencyBonus = document.getElementById('proficiencyBonus') as HTMLInputElement;
        if (proficiencyBonus) proficiencyBonus.value = this.data.proficiencyBonus || '+2';
        const passivePerception = document.getElementById('passivePerception') as HTMLInputElement;
        if (passivePerception) passivePerception.value = (this.data.passivePerception || 10).toString();
        const heroicInspiration = document.getElementById('heroicInspiration') as HTMLInputElement;
        if (heroicInspiration) heroicInspiration.checked = this.data.heroicInspiration || false;
        const hitPointsMax = document.getElementById('hitPointsMax') as HTMLInputElement;
        if (hitPointsMax) hitPointsMax.value = this.data.hitPointsMax.toString();
        const hitPointsCurrent = document.getElementById('hitPointsCurrent') as HTMLInputElement;
        if (hitPointsCurrent) hitPointsCurrent.value = this.data.hitPointsCurrent.toString();
        const hitPointsTemp = document.getElementById('hitPointsTemp') as HTMLInputElement;
        if (hitPointsTemp) hitPointsTemp.value = this.data.hitPointsTemp.toString();
        const hitDiceSpent = document.getElementById('hitDiceSpent') as HTMLInputElement;
        if (hitDiceSpent) hitDiceSpent.value = (this.data.hitDiceSpent || 0).toString();
        const hitDice = document.getElementById('hitDice') as HTMLInputElement;
        if (hitDice) hitDice.value = this.data.hitDice || '';

        // Death Saves
        const deathSave1 = document.getElementById('deathSave1') as HTMLInputElement;
        if (deathSave1) deathSave1.checked = this.data.deathSaves.success[0];
        const deathSave2 = document.getElementById('deathSave2') as HTMLInputElement;
        if (deathSave2) deathSave2.checked = this.data.deathSaves.success[1];
        const deathSave3 = document.getElementById('deathSave3') as HTMLInputElement;
        if (deathSave3) deathSave3.checked = this.data.deathSaves.success[2];
        const deathFail1 = document.getElementById('deathFail1') as HTMLInputElement;
        if (deathFail1) deathFail1.checked = this.data.deathSaves.failure[0];
        const deathFail2 = document.getElementById('deathFail2') as HTMLInputElement;
        if (deathFail2) deathFail2.checked = this.data.deathSaves.failure[1];
        const deathFail3 = document.getElementById('deathFail3') as HTMLInputElement;
        if (deathFail3) deathFail3.checked = this.data.deathSaves.failure[2];

        // Skills - rendered dynamically, no need to update here

        // Features & Spells
        const features = document.getElementById('features') as HTMLTextAreaElement;
        if (features) features.value = this.data.features || '';
        const feats = document.getElementById('feats') as HTMLTextAreaElement;
        if (feats) feats.value = this.data.feats || '';
        const speciesTraits = document.getElementById('speciesTraits') as HTMLTextAreaElement;
        if (speciesTraits) speciesTraits.value = this.data.speciesTraits || '';
        const spellcastingAbility = document.getElementById('spellcastingAbility') as HTMLInputElement;
        if (spellcastingAbility) spellcastingAbility.value = this.data.spellcastingAbility || '';
        const spellSaveDC = document.getElementById('spellSaveDC') as HTMLInputElement;
        if (spellSaveDC) spellSaveDC.value = (this.data.spellSaveDC || 0).toString();
        const spellAttackBonus = document.getElementById('spellAttackBonus') as HTMLInputElement;
        if (spellAttackBonus) spellAttackBonus.value = this.data.spellAttackBonus || '+0';
        const spellSlots1 = document.getElementById('spellSlots1') as HTMLInputElement;
        if (spellSlots1) spellSlots1.value = this.data.spellSlots.level1.current.toString();
        const spellSlots1Max = document.getElementById('spellSlots1Max') as HTMLInputElement;
        if (spellSlots1Max) spellSlots1Max.value = this.data.spellSlots.level1.max.toString();
        const spellSlots2 = document.getElementById('spellSlots2') as HTMLInputElement;
        if (spellSlots2) spellSlots2.value = this.data.spellSlots.level2.current.toString();
        const spellSlots2Max = document.getElementById('spellSlots2Max') as HTMLInputElement;
        if (spellSlots2Max) spellSlots2Max.value = this.data.spellSlots.level2.max.toString();
        const spellSlots3 = document.getElementById('spellSlots3') as HTMLInputElement;
        if (spellSlots3) spellSlots3.value = (this.data.spellSlots.level3?.current || 0).toString();
        const spellSlots3Max = document.getElementById('spellSlots3Max') as HTMLInputElement;
        if (spellSlots3Max) spellSlots3Max.value = (this.data.spellSlots.level3?.max || 0).toString();
        const spellSlots4 = document.getElementById('spellSlots4') as HTMLInputElement;
        if (spellSlots4) spellSlots4.value = (this.data.spellSlots.level4?.current || 0).toString();
        const spellSlots4Max = document.getElementById('spellSlots4Max') as HTMLInputElement;
        if (spellSlots4Max) spellSlots4Max.value = (this.data.spellSlots.level4?.max || 0).toString();
        const spellSlots5 = document.getElementById('spellSlots5') as HTMLInputElement;
        if (spellSlots5) spellSlots5.value = (this.data.spellSlots.level5?.current || 0).toString();
        const spellSlots5Max = document.getElementById('spellSlots5Max') as HTMLInputElement;
        if (spellSlots5Max) spellSlots5Max.value = (this.data.spellSlots.level5?.max || 0).toString();
        const spellSlots6 = document.getElementById('spellSlots6') as HTMLInputElement;
        if (spellSlots6) spellSlots6.value = (this.data.spellSlots.level6?.current || 0).toString();
        const spellSlots6Max = document.getElementById('spellSlots6Max') as HTMLInputElement;
        if (spellSlots6Max) spellSlots6Max.value = (this.data.spellSlots.level6?.max || 0).toString();
        const spellSlots7 = document.getElementById('spellSlots7') as HTMLInputElement;
        if (spellSlots7) spellSlots7.value = (this.data.spellSlots.level7?.current || 0).toString();
        const spellSlots7Max = document.getElementById('spellSlots7Max') as HTMLInputElement;
        if (spellSlots7Max) spellSlots7Max.value = (this.data.spellSlots.level7?.max || 0).toString();
        const spellSlots8 = document.getElementById('spellSlots8') as HTMLInputElement;
        if (spellSlots8) spellSlots8.value = (this.data.spellSlots.level8?.current || 0).toString();
        const spellSlots8Max = document.getElementById('spellSlots8Max') as HTMLInputElement;
        if (spellSlots8Max) spellSlots8Max.value = (this.data.spellSlots.level8?.max || 0).toString();
        const spellSlots9 = document.getElementById('spellSlots9') as HTMLInputElement;
        if (spellSlots9) spellSlots9.value = (this.data.spellSlots.level9?.current || 0).toString();
        const spellSlots9Max = document.getElementById('spellSlots9Max') as HTMLInputElement;
        if (spellSlots9Max) spellSlots9Max.value = (this.data.spellSlots.level9?.max || 0).toString();
        const knownSpells = document.getElementById('knownSpells') as HTMLTextAreaElement;
        if (knownSpells) knownSpells.value = this.data.knownSpells || '';

        // Equipment & Proficiencies
        const equipment = document.getElementById('equipment') as HTMLTextAreaElement;
        if (equipment) {
            const value = (this.data.equipment !== undefined && this.data.equipment !== null) ? this.data.equipment : '';
            equipment.value = value;
        }
        const equipmentDetail = document.getElementById('equipmentDetail') as HTMLTextAreaElement;
        if (equipmentDetail) equipmentDetail.value = (this.data.equipmentDetail !== undefined && this.data.equipmentDetail !== null) ? this.data.equipmentDetail : '';
        const armorProficiencies = document.getElementById('armorProficiencies') as HTMLTextAreaElement;
        if (armorProficiencies) {
            const value = (this.data.armorProficiencies !== undefined && this.data.armorProficiencies !== null) ? this.data.armorProficiencies : '';
            armorProficiencies.value = value;
        }
        const weaponProficiencies = document.getElementById('weaponProficiencies') as HTMLTextAreaElement;
        if (weaponProficiencies) weaponProficiencies.value = (this.data.weaponProficiencies !== undefined && this.data.weaponProficiencies !== null) ? this.data.weaponProficiencies : '';
        const toolProficiencies = document.getElementById('toolProficiencies') as HTMLTextAreaElement;
        if (toolProficiencies) toolProficiencies.value = (this.data.toolProficiencies !== undefined && this.data.toolProficiencies !== null) ? this.data.toolProficiencies : '';
        const languages = document.getElementById('languages') as HTMLTextAreaElement;
        if (languages) languages.value = (this.data.languages !== undefined && this.data.languages !== null) ? this.data.languages : '';
        const languagesPage2 = document.getElementById('languagesPage2') as HTMLTextAreaElement;
        if (languagesPage2) languagesPage2.value = (this.data.languages !== undefined && this.data.languages !== null) ? this.data.languages : '';

        // Coins
        const coinCP = document.getElementById('coinCP') as HTMLInputElement;
        if (coinCP) coinCP.value = (this.data.coins?.cp || 0).toString();
        const coinSP = document.getElementById('coinSP') as HTMLInputElement;
        if (coinSP) coinSP.value = (this.data.coins?.sp || 0).toString();
        const coinEP = document.getElementById('coinEP') as HTMLInputElement;
        if (coinEP) coinEP.value = (this.data.coins?.ep || 0).toString();
        const coinGP = document.getElementById('coinGP') as HTMLInputElement;
        if (coinGP) coinGP.value = (this.data.coins?.gp || 0).toString();
        const coinPP = document.getElementById('coinPP') as HTMLInputElement;
        if (coinPP) coinPP.value = (this.data.coins?.pp || 0).toString();

        // Backstory & Appearance
        const backstory = document.getElementById('backstory') as HTMLTextAreaElement;
        if (backstory) backstory.value = this.data.backstory || '';
        const appearance = document.getElementById('appearance') as HTMLTextAreaElement;
        if (appearance) appearance.value = this.data.appearance || '';
        const notes = document.getElementById('notes') as HTMLTextAreaElement;
        if (notes) notes.value = this.data.notes || '';

        // Ensure skills, weapons, and spells are rendered
        this.renderSkills();
        this.renderWeapons();
        this.renderSpells();
    }

    private saveData(): void {
        this.showSaveStatus('saving', 'Saving...');

        try {
            // Ensure all proficiency fields are captured from DOM before saving
            const armorProficiencies = document.getElementById('armorProficiencies') as HTMLTextAreaElement;
            if (armorProficiencies) {
                this.data.armorProficiencies = armorProficiencies.value;
            }

            const weaponProficiencies = document.getElementById('weaponProficiencies') as HTMLTextAreaElement;
            if (weaponProficiencies) this.data.weaponProficiencies = weaponProficiencies.value;

            const toolProficiencies = document.getElementById('toolProficiencies') as HTMLTextAreaElement;
            if (toolProficiencies) this.data.toolProficiencies = toolProficiencies.value;

            const languages = document.getElementById('languages') as HTMLTextAreaElement;
            if (languages) this.data.languages = languages.value;

            const equipment = document.getElementById('equipment') as HTMLTextAreaElement;
            if (equipment) this.data.equipment = equipment.value;

            // Capture current layout state from DOM before saving
            const skillsSection = document.getElementById('skillsSection');
            const weaponsSection = document.getElementById('weaponsSection');
            const proficienciesSection = document.getElementById('proficienciesSection');
            const equipmentSection = document.getElementById('equipmentSection');

            const currentLayout: LayoutData = {
                skillsWidth: skillsSection ? skillsSection.offsetWidth : 250,
                weaponsWidth: weaponsSection ? weaponsSection.offsetWidth : 0,
                proficienciesWidth: proficienciesSection ? proficienciesSection.offsetWidth : 0,
                equipmentWidth: equipmentSection ? equipmentSection.offsetWidth : 0
            };

            // Update layout manager with current state
            this.layoutManager.setLayout(currentLayout);

            // Save to file using File System Access API
            this.saveToFile();
        } catch (e) {
            console.error('Error saving data:', e);
            this.showSaveStatus('error', 'Save failed');
        }
    }

    private async saveToFile(): Promise<void> {
        try {
            // Create the new structure with character-definition and sheet-layout
            const fileData = {
                'character-definition': this.data,
                'sheet-layout': this.layoutManager.getLayout()
            };

            const dataToSave = JSON.stringify(fileData, null, 2);
            const blob = new Blob([dataToSave], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Check if File System Access API is supported
            if ('showSaveFilePicker' in window) {
                try {
                    const fileHandle = await (window as any).showSaveFilePicker({
                        suggestedName: 'character-sheet.json',
                        types: [{
                            description: 'JSON files',
                            accept: { 'application/json': ['.json'] }
                        }]
                    });

                    const writable = await fileHandle.createWritable();
                    await writable.write(dataToSave);
                    await writable.close();

                    this.showSaveStatus('saved', 'Saved to file');
                    setTimeout(() => {
                        const statusEl = document.getElementById('saveStatus');
                        if (statusEl) {
                            statusEl.textContent = '';
                            statusEl.className = 'save-status';
                        }
                    }, 2000);
                    return;
                } catch (err: any) {
                    // User cancelled or error - fall back to download
                    if (err.name !== 'AbortError') {
                        console.error('Error saving file:', err);
                    }
                }
            }

            // Fallback: Download file
            const a = document.createElement('a');
            a.href = url;
            a.download = 'character-sheet.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showSaveStatus('saved', 'Downloaded');
            setTimeout(() => {
                const statusEl = document.getElementById('saveStatus');
                if (statusEl) {
                    statusEl.textContent = '';
                    statusEl.className = 'save-status';
                }
            }, 2000);
        } catch (e) {
            console.error('Error saving to file:', e);
            this.showSaveStatus('error', 'Save failed');
        }
    }

    private renderSkills(): void {
        const skillsList = document.getElementById('skillsList');
        if (!skillsList) return;

        skillsList.innerHTML = '';

        this.data.skills.forEach(skill => {
            const row = this.createSkillRow(skill);
            skillsList.appendChild(row);
        });

        // Update max IDs
        if (this.data.skills.length > 0) {
            const maxId = Math.max(...this.data.skills.map(s => parseInt(s.id)));
            this.nextSkillId = maxId + 1;
        }
    }

    private createSkillRow(skill: { id: string; name: string; ability: string; proficient: boolean; modifier: string }): HTMLElement {
        const row = document.createElement('div');
        row.className = 'skill-row';
        row.dataset.skillId = skill.id;

        row.innerHTML = `
            <input type="checkbox" class="skill-checkbox" ${skill.proficient ? 'checked' : ''} data-skill-id="${skill.id}">
            <input type="text" class="skill-name" value="${skill.name}" data-skill-id="${skill.id}" placeholder="Skill name">
            <select class="skill-ability-select" data-skill-id="${skill.id}">
                <option value="str" ${skill.ability === 'str' ? 'selected' : ''}>STR</option>
                <option value="dex" ${skill.ability === 'dex' ? 'selected' : ''}>DEX</option>
                <option value="con" ${skill.ability === 'con' ? 'selected' : ''}>CON</option>
                <option value="int" ${skill.ability === 'int' ? 'selected' : ''}>INT</option>
                <option value="wis" ${skill.ability === 'wis' ? 'selected' : ''}>WIS</option>
                <option value="cha" ${skill.ability === 'cha' ? 'selected' : ''}>CHA</option>
            </select>
            <input type="text" class="skill-modifier" value="${skill.modifier || '+0'}" data-skill-id="${skill.id}" placeholder="+0" aria-label="Skill modifier">
            <button type="button" class="remove-btn" data-skill-id="${skill.id}" aria-label="Remove skill">×</button>
        `;

        // Add event listeners
        const checkbox = row.querySelector('.skill-checkbox') as HTMLInputElement;
        const nameInput = row.querySelector('.skill-name') as HTMLInputElement;
        const abilitySelect = row.querySelector('.skill-ability-select') as HTMLSelectElement;
        const modifierInput = row.querySelector('.skill-modifier') as HTMLInputElement;
        const removeBtn = row.querySelector('.remove-btn') as HTMLButtonElement;

        checkbox.addEventListener('change', () => {
            const skillData = this.data.skills.find(s => s.id === skill.id);
            if (skillData) {
                skillData.proficient = checkbox.checked;
                this.debouncedPushHistory();
            }
        });

        nameInput.addEventListener('input', () => {
            const skillData = this.data.skills.find(s => s.id === skill.id);
            if (skillData) {
                skillData.name = nameInput.value;
                this.debouncedPushHistory();
            }
        });

        abilitySelect.addEventListener('change', () => {
            const skillData = this.data.skills.find(s => s.id === skill.id);
            if (skillData) {
                skillData.ability = abilitySelect.value as AbilityName;
                this.debouncedPushHistory();
            }
        });

        modifierInput.addEventListener('input', () => {
            const skillData = this.data.skills.find(s => s.id === skill.id);
            if (skillData) {
                skillData.modifier = modifierInput.value;
                this.debouncedPushHistory();
            }
        });

        removeBtn.addEventListener('click', () => {
            this.removeSkill(skill.id);
        });

        return row;
    }

    private addSkill(): void {
        const newSkill = {
            id: this.nextSkillId.toString(),
            name: '',
            ability: 'str' as const,
            proficient: false,
            modifier: '+0'
        };
        this.data.skills.push(newSkill);
        this.nextSkillId++;
        this.renderSkills();
        this.pushHistory();
    }

    private removeSkill(id: string): void {
        this.data.skills = this.data.skills.filter(s => s.id !== id);
        this.renderSkills();
        this.pushHistory();
    }


    private renderWeapons(): void {
        const weaponsBody = document.getElementById('weaponsTableBody');
        if (!weaponsBody) return;

        weaponsBody.innerHTML = '';

        this.data.weapons.forEach(weapon => {
            const row = this.createWeaponRow(weapon);
            weaponsBody.appendChild(row);
        });

        // Update max IDs
        if (this.data.weapons.length > 0) {
            const maxId = Math.max(...this.data.weapons.map(w => parseInt(w.id)));
            this.nextWeaponId = maxId + 1;
        }
    }

    // Generic helper to create input field with event listener
    private createInputField<T extends { id: string }>(
        data: T,
        key: keyof T,
        className: string,
        placeholder: string,
        onUpdate: (data: T, value: string) => void
    ): HTMLInputElement {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = className;
        input.value = String(data[key] || '');
        input.placeholder = placeholder;
        input.setAttribute(`data-${className.split('-')[0]}-id`, data.id);
        input.addEventListener('input', () => {
            onUpdate(data, input.value);
        });
        return input;
    }

    private createWeaponRow(weapon: { id: string; name: string; atkBonus: string; damage: string; notes: string }): HTMLElement {
        const row = document.createElement('tr');
        row.dataset.weaponId = weapon.id;

        // Define weapon fields in a data-driven way
        const weaponFields = [
            { key: 'name' as const, placeholder: 'Weapon name', className: 'weapon-name' },
            { key: 'atkBonus' as const, placeholder: '+6', className: 'weapon-atk' },
            { key: 'damage' as const, placeholder: '1d8+3 slashing', className: 'weapon-damage' },
            { key: 'notes' as const, placeholder: 'Notes', className: 'weapon-notes' }
        ];

        // Create input fields
        weaponFields.forEach(field => {
            const td = document.createElement('td');
            const input = this.createInputField(weapon, field.key, field.className, field.placeholder, (data, value) => {
                (data as any)[field.key] = value;
                this.debouncedPushHistory();
            });
            td.appendChild(input);
            row.appendChild(td);
        });

        // Add remove button
        const removeTd = document.createElement('td');
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '×';
        removeBtn.setAttribute('data-weapon-id', weapon.id);
        removeBtn.setAttribute('aria-label', 'Remove weapon');
        removeBtn.addEventListener('click', () => {
            this.removeWeapon(weapon.id);
        });
        removeTd.appendChild(removeBtn);
        row.appendChild(removeTd);

        return row;
    }

    private async loadFromFile(): Promise<void> {
        this.showSaveStatus('saving', 'Loading...');

        try {
            // Check if File System Access API is supported
            if ('showOpenFilePicker' in window) {
                try {
                    const [fileHandle] = await (window as any).showOpenFilePicker({
                        types: [{
                            description: 'JSON files',
                            accept: { 'application/json': ['.json'] }
                        }]
                    });

                    const file = await fileHandle.getFile();
                    const text = await file.text();

                    try {
                        const fileData = JSON.parse(text);
                        console.log('Loaded data:', fileData);

                        // Handle both old format (direct data) and new format (with character-definition and sheet-layout)
                        let characterData: any;
                        let layoutData: LayoutData | undefined;

                        if (fileData['character-definition'] && fileData['sheet-layout']) {
                            // New format
                            characterData = fileData['character-definition'];
                            layoutData = fileData['sheet-layout'];
                        } else {
                            // Old format - just character data
                            characterData = fileData;
                        }

                        // Apply layout if available
                        if (layoutData) {
                            this.layoutManager.setLayout(layoutData);
                        }

                        // Validate and merge with defaults
                        this.data = this.validateAndMigrateData(characterData);
                        // Reset history after loading
                        this.history = [];
                        this.historyIndex = -1;
                        this.pushHistory();
                        this.updateAll();
                        this.updateHistoryButtons();
                        this.showSaveStatus('saved', 'Loaded from file');
                        setTimeout(() => {
                            const statusEl = document.getElementById('saveStatus');
                            if (statusEl) {
                                statusEl.textContent = '';
                                statusEl.className = 'save-status';
                            }
                        }, 2000);
                    } catch (parseErr) {
                        console.error('Error parsing JSON:', parseErr);
                        this.showSaveStatus('error', 'Invalid JSON file');
                    }
                    return;
                } catch (err: any) {
                    // User cancelled or error
                    if (err.name === 'AbortError') {
                        // User cancelled - don't show error
                        const statusEl = document.getElementById('saveStatus');
                        if (statusEl) {
                            statusEl.textContent = '';
                            statusEl.className = 'save-status';
                        }
                        return;
                    }
                    console.error('Error loading file:', err);
                    this.showSaveStatus('error', `Load failed: ${err.message || 'Unknown error'}`);
                    return;
                }
            }

            // Fallback: Use file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';
            input.onchange = (e: Event) => {
                const target = e.target as HTMLInputElement;
                const file = target.files?.[0];
                if (!file) {
                    this.showSaveStatus('error', 'No file selected');
                    return;
                }

                const reader = new FileReader();
                reader.onerror = () => {
                    console.error('FileReader error');
                    this.showSaveStatus('error', 'Error reading file');
                };
                reader.onload = (event) => {
                    try {
                        const text = event.target?.result as string;
                        if (!text) {
                            throw new Error('File is empty');
                        }
                        const fileData = JSON.parse(text);
                        console.log('Loaded data:', fileData);

                        // Handle both old format (direct data) and new format (with character-definition and sheet-layout)
                        let characterData: any;
                        let layoutData: LayoutData | undefined;

                        if (fileData['character-definition'] && fileData['sheet-layout']) {
                            // New format
                            characterData = fileData['character-definition'];
                            layoutData = fileData['sheet-layout'];
                        } else {
                            // Old format - just character data
                            characterData = fileData;
                        }

                        // Apply layout if available
                        if (layoutData) {
                            this.layoutManager.setLayout(layoutData);
                        }

                        // Validate and merge with defaults
                        this.data = this.validateAndMigrateData(characterData);
                        // Reset history after loading
                        this.history = [];
                        this.historyIndex = -1;
                        this.pushHistory();
                        this.updateAll();
                        this.updateHistoryButtons();
                        this.showSaveStatus('saved', 'Loaded from file');
                        setTimeout(() => {
                            const statusEl = document.getElementById('saveStatus');
                            if (statusEl) {
                                statusEl.textContent = '';
                                statusEl.className = 'save-status';
                            }
                        }, 2000);
                    } catch (err: any) {
                        console.error('Error parsing file:', err);
                        this.showSaveStatus('error', `Invalid file: ${err.message || 'Invalid JSON'}`);
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        } catch (e: any) {
            console.error('Error loading from file:', e);
            this.showSaveStatus('error', `Load failed: ${e.message || 'Unknown error'}`);
        }
    }

    private addWeapon(): void {
        const newWeapon = {
            id: this.nextWeaponId.toString(),
            name: '',
            atkBonus: '',
            damage: '',
            notes: ''
        };
        this.data.weapons.push(newWeapon);
        this.nextWeaponId++;
        this.renderWeapons();
        this.pushHistory();
    }

    private removeWeapon(id: string): void {
        this.data.weapons = this.data.weapons.filter(w => w.id !== id);
        this.renderWeapons();
        this.pushHistory();
    }

    private renderSpells(): void {
        const spellsBody = document.getElementById('spellsTableBody');
        if (!spellsBody) return;

        spellsBody.innerHTML = '';

        this.data.spells.forEach(spell => {
            const row = this.createSpellRow(spell);
            spellsBody.appendChild(row);
        });

        // Update max IDs
        if (this.data.spells.length > 0) {
            const maxId = Math.max(...this.data.spells.map(s => parseInt(s.id)));
            this.nextSpellId = maxId + 1;
        }
    }

    private createSpellRow(spell: { id: string; name: string; level: string; castingTime: string; concentration: string; range: string; material: string; notes: string }): HTMLElement {
        const row = document.createElement('tr');
        row.dataset.spellId = spell.id;

        // Define spell fields in a data-driven way
        const spellFields = [
            { key: 'name' as const, placeholder: 'Fire Bolt', className: 'spell-name' },
            { key: 'level' as const, placeholder: 'Cantrip', className: 'spell-level' },
            { key: 'castingTime' as const, placeholder: '1 action', className: 'spell-casting-time' },
            { key: 'concentration' as const, placeholder: 'Concentration, Ritual', className: 'spell-concentration' },
            { key: 'range' as const, placeholder: '120 ft', className: 'spell-range' },
            { key: 'material' as const, placeholder: 'Required Material', className: 'spell-material' },
            { key: 'notes' as const, placeholder: 'Notes', className: 'spell-notes' }
        ];

        // Create input fields
        spellFields.forEach(field => {
            const td = document.createElement('td');
            const input = this.createInputField(spell, field.key, field.className, field.placeholder, (data, value) => {
                (data as any)[field.key] = value;
                this.debouncedPushHistory();
            });
            td.appendChild(input);
            row.appendChild(td);
        });

        // Add remove button
        const removeTd = document.createElement('td');
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '×';
        removeBtn.setAttribute('data-spell-id', spell.id);
        removeBtn.setAttribute('aria-label', 'Remove spell');
        removeBtn.addEventListener('click', () => {
            this.removeSpell(spell.id);
        });
        removeTd.appendChild(removeBtn);
        row.appendChild(removeTd);

        return row;
    }

    private addSpell(): void {
        const newSpell = {
            id: this.nextSpellId.toString(),
            name: '',
            level: '',
            castingTime: '',
            concentration: '',
            range: '',
            material: '',
            notes: ''
        };
        this.data.spells.push(newSpell);
        this.nextSpellId++;
        this.renderSpells();
        this.pushHistory();
    }

    private removeSpell(id: string): void {
        this.data.spells = this.data.spells.filter(s => s.id !== id);
        this.renderSpells();
        this.pushHistory();
    }

    private showSaveStatus(status: 'saving' | 'saved' | 'error', message: string): void {
        const statusEl = document.getElementById('saveStatus');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `save-status ${status}`;
        }
    }
}

// Simple Accordion Function
function initializeAccordions() {
    const groups = document.querySelectorAll('.content-group');

    groups.forEach(group => {
        const header = group.querySelector('.accordion-header') as HTMLElement;
        if (!header) return;

        header.addEventListener('click', () => {
            group.classList.toggle('collapsed');

            // Save state to localStorage
            const groupName = group.getAttribute('data-group');
            if (groupName) {
                const isCollapsed = group.classList.contains('collapsed');
                localStorage.setItem(`accordion-${groupName}`, isCollapsed.toString());
            }
        });

        // Load saved state
        const groupName = group.getAttribute('data-group');
        if (groupName) {
            const savedState = localStorage.getItem(`accordion-${groupName}`);
            if (savedState === 'true') {
                group.classList.add('collapsed');
            }
        }
    });

    // On mobile, collapse some sections by default (first time only)
    if (window.innerWidth <= 768) {
        const sectionsToCollapse = ['backstory-appearance', 'equipment-coins'];

        sectionsToCollapse.forEach(sectionName => {
            // Only if not previously set by user
            if (localStorage.getItem(`accordion-${sectionName}`) === null) {
                const section = document.querySelector(`[data-group="${sectionName}"]`);
                if (section) {
                    section.classList.add('collapsed');
                    localStorage.setItem(`accordion-${sectionName}`, 'true');
                }
            }
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new CharacterSheet();
        initializeAccordions();
    });
} else {
    new CharacterSheet();
    initializeAccordions();
}
