// Import Google Drive Manager
import { type DriveFile, GoogleDriveManager } from './google-drive-manager.js';

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
    spellColumnWidths?: {
        name?: number;
        level?: number;
        castingTime?: number;
        range?: number;
        duration?: number;
        notes?: number;
    };
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
            equipmentWidth: 0,
            spellColumnWidths: {}
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

        // Apply spell column widths
        this.applySpellColumnWidths();
    }

    private applySpellColumnWidths(): void {
        if (!this.layout.spellColumnWidths) return;

        const headerRow = document.getElementById('spellsHeaderRow');
        if (!headerRow) return;

        const headers = headerRow.querySelectorAll('th[data-column]');
        headers.forEach(th => {
            const column = (th as HTMLElement).dataset.column;
            if (column && this.layout.spellColumnWidths && this.layout.spellColumnWidths[column as keyof typeof this.layout.spellColumnWidths]) {
                const width = this.layout.spellColumnWidths[column as keyof typeof this.layout.spellColumnWidths];
                (th as HTMLElement).style.width = `${width}px`;
            }
        });
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

        // Spell column resizing
        this.initializeSpellColumnResize();
    }

    private initializeSpellColumnResize(): void {
        const headerRow = document.getElementById('spellsHeaderRow');
        if (!headerRow) return;

        const headers = headerRow.querySelectorAll('th[data-column]');
        headers.forEach(th => {
            const column = (th as HTMLElement).dataset.column;
            if (!column) return;

            let isResizing = false;
            let startX = 0;
            let startWidth = 0;

            const onMouseMove = (e: MouseEvent) => {
                if (!isResizing) return;
                const diff = e.clientX - startX;
                const newWidth = Math.max(50, startWidth + diff);
                (th as HTMLElement).style.width = `${newWidth}px`;
            };

            const onMouseUp = () => {
                if (!isResizing) return;
                isResizing = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                (th as HTMLElement).style.cursor = '';
                document.body.style.cursor = '';
                document.body.style.userSelect = '';

                // Save the new width
                if (!this.layout.spellColumnWidths) {
                    this.layout.spellColumnWidths = {};
                }
                this.layout.spellColumnWidths[column as keyof typeof this.layout.spellColumnWidths] = (th as HTMLElement).offsetWidth;
                this.saveLayout();
            };

            (th as HTMLElement).addEventListener('mousedown', (e: MouseEvent) => {
                const rect = (th as HTMLElement).getBoundingClientRect();
                const isNearRightEdge = e.clientX > rect.right - 10;

                if (isNearRightEdge) {
                    isResizing = true;
                    startX = e.clientX;
                    startWidth = (th as HTMLElement).offsetWidth;
                    (th as HTMLElement).style.cursor = 'col-resize';
                    document.body.style.cursor = 'col-resize';
                    document.body.style.userSelect = 'none';
                    
                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                    e.preventDefault();
                }
            });

            (th as HTMLElement).addEventListener('mousemove', (e: MouseEvent) => {
                if (isResizing) return;
                const rect = (th as HTMLElement).getBoundingClientRect();
                const isNearRightEdge = e.clientX > rect.right - 10;
                (th as HTMLElement).style.cursor = isNearRightEdge ? 'col-resize' : '';
            });
        });
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
    proficiencyBonus: number;
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
        range: string;
        duration: string;
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

    // Character Image
    characterImageFileId: string | null;
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

    // Google Drive integration
    private googleDriveManager: GoogleDriveManager | null = null;
    private currentDriveFileId: string | null = null;
    private currentDriveFileName: string | null = null;

    // Local storage
    private readonly LOCAL_STORAGE_KEY = 'dnd_character_data';
    private readonly LOCAL_LAYOUT_KEY = 'dnd_character_layout';
    private readonly LOCAL_DRIVE_FILE_KEY = 'dnd_drive_file_info';
    private readonly LOCAL_IMAGE_KEY = 'dnd_character_image';

    constructor() {
        // Initialize layout manager first (will be updated with saved layout in loadData)
        this.layoutManager = new LayoutManager();
        this.layoutManager.setSaveCallback(() => {
            this.saveToLocalStorage(); // Auto-save on layout changes
        });
        
        // Initialize with default data
        this.data = this.getDefaultData();
        
        // Try to load from localStorage
        this.loadFromLocalStorage();
        
        // Initialize history with current state
        this.pushHistory();
        this.initializeGoogleDrive();
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
                        characterData.skills = Object.entries(oldSkills).map(([key], index) => ({
                            id: (index + 1).toString(),
                            name: skillNames[key] || key,
                            ability: abilityMap[key] || 'str',
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
                    // Migrate old spell format (concentration, material) to new format (duration)
                    if (characterData.spells && Array.isArray(characterData.spells)) {
                        characterData.spells = characterData.spells.map((spell: any) => {
                            // If spell has old format fields, migrate to new format
                            if (spell.concentration !== undefined || spell.material !== undefined) {
                                const { concentration, material, ...rest } = spell;
                                return {
                                    ...rest,
                                    duration: spell.duration || '' // Add duration field if missing
                                };
                            }
                            // If spell doesn't have duration field, add it
                            if (spell.duration === undefined) {
                                return {
                                    ...spell,
                                    duration: ''
                                };
                            }
                            return spell;
                        });
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

    private normalizeSkills(skills: Array<{ id: string; name: string; ability: string; modifier?: string; proficient?: boolean }>): Array<{ id: string; name: string; ability: AbilityName; modifier: string }> {
        return skills.map(s => ({
            id: s.id,
            name: s.name,
            ability: (s.ability || 'str') as AbilityName,
            modifier: s.modifier ?? '+0'
        }));
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
            skills: this.normalizeSkills(data.skills || defaults.skills),
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
            notes: mergeDefined(defaults.notes, data.notes),
            characterImageFileId: mergeDefined(defaults.characterImageFileId, data.characterImageFileId)
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
            proficiencyBonus: 2,
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
            notes: '',
            characterImageFileId: null
        };
    }

    private initializeEventListeners(): void {
        // Basic Info
        this.addInputListener('characterName', (v) => { this.data.characterName = v; });
        this.addInputListener('playerName', (v) => { this.data.playerName = v; });
        this.addInputListener('race', (v) => { this.data.race = v; });
        this.addInputListener('characterClass', (v) => { this.data.class = v; });
        this.addInputListener('level', (v) => {
            this.data.level = this.validateLevel(parseInt(v) || 1);
        });
        this.addInputListener('background', (v) => { this.data.background = v; });
        this.addInputListener('subclass', (v) => { this.data.subclass = v; });
        this.addInputListener('alignment', (v) => { this.data.alignment = v; });
        this.addInputListener('experience', (v) => { this.data.experience = parseInt(v) || 0; });

        // Ability Scores - setup using helper function (reduces duplication)
        this.setupAbilityScoreListeners();

        // Saving Throws
        this.addCheckboxListener('strSaveProf', (v) => { this.data.savingThrows.str = v; });
        this.addCheckboxListener('dexSaveProf', (v) => { this.data.savingThrows.dex = v; });
        this.addCheckboxListener('conSaveProf', (v) => { this.data.savingThrows.con = v; });
        this.addCheckboxListener('intSaveProf', (v) => { this.data.savingThrows.int = v; });
        this.addCheckboxListener('wisSaveProf', (v) => { this.data.savingThrows.wis = v; });
        this.addCheckboxListener('chaSaveProf', (v) => { this.data.savingThrows.cha = v; });

        // Combat Stats
        this.addInputListener('armorClass', (v) => {
            const enteredAC = parseInt(v) || 10;
            // If shield is on, user is editing total AC, so calculate base AC
            const shieldBonus = this.data.shield ? 2 : 0;
            this.data.armorClass = enteredAC - shieldBonus;
            // Update display to show total AC
            this.updateDisplayedArmorClass();
        });
        this.addCheckboxListener('shield', (v) => {
            this.data.shield = v;
            this.updateDisplayedArmorClass();
        });
        this.addInputListener('initiative', (v) => { this.data.initiative = parseInt(v) || 0; });
        this.addInputListener('speed', (v) => { this.data.speed = parseInt(v) || 30; });
        this.addInputListener('size', (v) => { this.data.size = v; });
        this.addInputListener('proficiencyBonus', (v) => {
            this.data.proficiencyBonus = parseInt(v) || 2;
            this.updateToHitBonuses();
        });
        this.addInputListener('passivePerception', (v) => { this.data.passivePerception = parseInt(v) || 10; });
        this.addCheckboxListener('heroicInspiration', (v) => { this.data.heroicInspiration = v; });
        this.addInputListener('hitPointsMax', (v) => { this.data.hitPointsMax = parseInt(v) || 1; });
        this.addInputListener('hitPointsCurrent', (v) => { this.data.hitPointsCurrent = parseInt(v) || 0; });
        this.addInputListener('hitPointsTemp', (v) => { this.data.hitPointsTemp = parseInt(v) || 0; });
        this.addInputListener('hitDiceSpent', (v) => { this.data.hitDiceSpent = parseInt(v) || 0; });
        this.addInputListener('hitDice', (v) => { this.data.hitDice = v; });

        // Death Saves
        this.addCheckboxListener('deathSave1', (v) => { this.data.deathSaves.success[0] = v; });
        this.addCheckboxListener('deathSave2', (v) => { this.data.deathSaves.success[1] = v; });
        this.addCheckboxListener('deathSave3', (v) => { this.data.deathSaves.success[2] = v; });
        this.addCheckboxListener('deathFail1', (v) => { this.data.deathSaves.failure[0] = v; });
        this.addCheckboxListener('deathFail2', (v) => { this.data.deathSaves.failure[1] = v; });
        this.addCheckboxListener('deathFail3', (v) => { this.data.deathSaves.failure[2] = v; });

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


        // Google Drive buttons
        const signInBtn = document.getElementById('signInBtn');
        if (signInBtn) {
            signInBtn.addEventListener('click', async () => {
                if (this.googleDriveManager) {
                    try {
                        await this.googleDriveManager.requestAccessToken();
                        this.showSaveStatus('saved', 'Signed in successfully');
                        setTimeout(() => {
                            const statusEl = document.getElementById('saveStatus');
                            if (statusEl) {
                                statusEl.textContent = '';
                                statusEl.className = 'save-status';
                            }
                        }, 2000);
                    } catch (error) {
                        console.error('Sign-in error:', error);
                        this.showSaveStatus('error', 'Failed to sign in');
                    }
                }
            });
        }

        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => {
                if (this.googleDriveManager) {
                    this.googleDriveManager.signOut();
                    this.showSaveStatus('saved', 'Signed out');
                    setTimeout(() => {
                        const statusEl = document.getElementById('saveStatus');
                        if (statusEl) {
                            statusEl.textContent = '';
                            statusEl.className = 'save-status';
                        }
                    }, 2000);
                }
            });
        }

        const saveToDriveBtn = document.getElementById('saveToDriveBtn');
        if (saveToDriveBtn) {
            saveToDriveBtn.addEventListener('click', () => this.saveToGoogleDrive());
        }

        const saveAsNewBtn = document.getElementById('saveAsNewBtn');
        if (saveAsNewBtn) {
            saveAsNewBtn.addEventListener('click', () => this.saveAsNewToGoogleDrive());
        }

        const loadFromDriveBtn = document.getElementById('loadFromDriveBtn');
        if (loadFromDriveBtn) {
            loadFromDriveBtn.addEventListener('click', () => this.showGoogleDriveFilePicker());
        }

        // Modal close buttons
        const modal = document.getElementById('googleDriveModal');
        const modalClose = modal?.querySelector('.modal-close');
        const modalCloseBtn = modal?.querySelector('.modal-close-btn');

        if (modalClose) {
            modalClose.addEventListener('click', () => {
                if (modal) modal.style.display = 'none';
            });
        }

        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => {
                if (modal) modal.style.display = 'none';
            });
        }

        // Close modal when clicking outside
        if (modal) {
            window.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
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
        this.addTextareaListener('features', (v) => { this.data.features = v; });
        this.addTextareaListener('feats', (v) => { this.data.feats = v; });
        this.addTextareaListener('speciesTraits', (v) => { this.data.speciesTraits = v; });
        this.addInputListener('spellSlots1', (v) => { this.data.spellSlots.level1.current = parseInt(v) || 0; });
        this.addInputListener('spellSlots2', (v) => { this.data.spellSlots.level2.current = parseInt(v) || 0; });
        this.addInputListener('spellSlots3', (v) => { this.data.spellSlots.level3.current = parseInt(v) || 0; });
        this.addInputListener('spellSlots4', (v) => { this.data.spellSlots.level4.current = parseInt(v) || 0; });
        this.addInputListener('spellSlots5', (v) => { this.data.spellSlots.level5.current = parseInt(v) || 0; });
        this.addInputListener('spellSlots6', (v) => { this.data.spellSlots.level6.current = parseInt(v) || 0; });
        this.addInputListener('spellSlots7', (v) => { this.data.spellSlots.level7.current = parseInt(v) || 0; });
        this.addInputListener('spellSlots8', (v) => { this.data.spellSlots.level8.current = parseInt(v) || 0; });
        this.addInputListener('spellSlots9', (v) => { this.data.spellSlots.level9.current = parseInt(v) || 0; });
        this.addInputListener('spellSlots1Max', (v) => { this.data.spellSlots.level1.max = parseInt(v) || 0; });
        this.addInputListener('spellSlots2Max', (v) => { this.data.spellSlots.level2.max = parseInt(v) || 0; });
        this.addInputListener('spellSlots3Max', (v) => { this.data.spellSlots.level3.max = parseInt(v) || 0; });
        this.addInputListener('spellSlots4Max', (v) => { this.data.spellSlots.level4.max = parseInt(v) || 0; });
        this.addInputListener('spellSlots5Max', (v) => { this.data.spellSlots.level5.max = parseInt(v) || 0; });
        this.addInputListener('spellSlots6Max', (v) => { this.data.spellSlots.level6.max = parseInt(v) || 0; });
        this.addInputListener('spellSlots7Max', (v) => { this.data.spellSlots.level7.max = parseInt(v) || 0; });
        this.addInputListener('spellSlots8Max', (v) => { this.data.spellSlots.level8.max = parseInt(v) || 0; });
        this.addInputListener('spellSlots9Max', (v) => { this.data.spellSlots.level9.max = parseInt(v) || 0; });
        this.addInputListener('spellcastingAbility', (v) => { this.data.spellcastingAbility = v; });
        this.addInputListener('spellSaveDC', (v) => { this.data.spellSaveDC = parseInt(v) || 0; });
        this.addInputListener('spellAttackBonus', (v) => { this.data.spellAttackBonus = v; });
        this.addTextareaListener('knownSpells', (v) => { this.data.knownSpells = v; });

        // Equipment & Proficiencies
        this.addTextareaListener('equipment', (v) => { this.data.equipment = v; });
        this.addTextareaListener('equipmentDetail', (v) => { this.data.equipmentDetail = v; });
        this.addTextareaListener('armorProficiencies', (v) => { this.data.armorProficiencies = v; });
        this.addTextareaListener('weaponProficiencies', (v) => { this.data.weaponProficiencies = v; });
        this.addTextareaListener('toolProficiencies', (v) => { this.data.toolProficiencies = v; });
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
        this.addInputListener('coinCP', (v) => { this.data.coins.cp = parseInt(v) || 0; });
        this.addInputListener('coinSP', (v) => { this.data.coins.sp = parseInt(v) || 0; });
        this.addInputListener('coinEP', (v) => { this.data.coins.ep = parseInt(v) || 0; });
        this.addInputListener('coinGP', (v) => { this.data.coins.gp = parseInt(v) || 0; });
        this.addInputListener('coinPP', (v) => { this.data.coins.pp = parseInt(v) || 0; });

        // Backstory & Appearance
        this.addTextareaListener('backstory', (v) => { this.data.backstory = v; });
        this.addTextareaListener('appearance', (v) => { this.data.appearance = v; });
        this.addTextareaListener('notes', (v) => { this.data.notes = v; });

        // Character Image
        const uploadImageBtn = document.getElementById('uploadImageBtn');
        const imageFileInput = document.getElementById('imageFileInput') as HTMLInputElement;
        const removeImageBtn = document.getElementById('removeImageBtn');

        if (uploadImageBtn && imageFileInput) {
            uploadImageBtn.addEventListener('click', () => {
                imageFileInput.click();
            });

            imageFileInput.addEventListener('change', async () => {
                const file = imageFileInput.files?.[0];
                if (file) {
                    await this.handleImageUpload(file);
                    // Clear the input so the same file can be selected again
                    imageFileInput.value = '';
                }
            });
        }

        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', () => {
                this.removeCharacterImage();
            });
        }
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

        // Update to-hit bonuses if strength or dexterity changed
        if (ability === 'str' || ability === 'dex') {
            this.updateToHitBonuses();
        }
    }

    private updateDisplayedArmorClass(): void {
        const armorClass = document.getElementById('armorClass') as HTMLInputElement;
        if (!armorClass) return;

        // Calculate displayed AC: base AC + shield bonus
        const baseAC = this.data.armorClass || 10;
        const shieldBonus = this.data.shield ? 2 : 0;
        const displayedAC = baseAC + shieldBonus;

        // Update the displayed value (but don't change the stored base value)
        armorClass.value = displayedAC.toString();
    }

    private updateToHitBonuses(): void {
        // Calculate Strength to hit: STR modifier + proficiency bonus
        const strMod = this.parseModifier(this.data.abilityModifiers.str);
        const profBonus = this.data.proficiencyBonus || 0;
        const strToHit = strMod + profBonus;

        const strToHitEl = document.getElementById('strToHit') as HTMLInputElement;
        if (strToHitEl) {
            strToHitEl.value = this.formatModifier(strToHit);
        }

        // Calculate Dexterity to hit: DEX modifier + proficiency bonus
        const dexMod = this.parseModifier(this.data.abilityModifiers.dex);
        const dexToHit = dexMod + profBonus;

        const dexToHitEl = document.getElementById('dexToHit') as HTMLInputElement;
        if (dexToHitEl) {
            dexToHitEl.value = this.formatModifier(dexToHit);
        }
    }

    private parseModifier(modifier: string): number {
        // Parse a modifier string like "+2" or "-1" into a number
        if (!modifier) return 0;
        const cleaned = modifier.trim().replace(/\s/g, '');
        return parseInt(cleaned) || 0;
    }

    private formatModifier(value: number): string {
        // Format a number as a modifier string like "+2" or "-1"
        if (value >= 0) {
            return '+' + value;
        } else {
            return value.toString();
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
            this.saveToLocalStorage(); // Auto-save to localStorage
        }, 500);
    }

    // Setup ability score listeners (reduces code duplication)
    private setupAbilityScoreListeners(): void {
        const abilities: AbilityName[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        const sources: AbilitySource[] = ['base', 'race', 'asi', 'feat', 'magic'];

        abilities.forEach(ability => {
            sources.forEach(source => {
                // Handle special casing for ASI (all caps in HTML)
                let fieldSuffix: string;
                if (source === 'asi') {
                    fieldSuffix = 'ASI'; // Match HTML id pattern
                } else {
                    fieldSuffix = source.charAt(0).toUpperCase() + source.slice(1);
                }
                const fieldName = `${ability}${fieldSuffix}`;

                this.addInputListener(fieldName, (v) => {
                    // Parse the value, allowing empty string to be treated as 0
                    const parsedValue = v === '' ? 0 : parseInt(v);

                    if (source === 'base') {
                        // Base score: default 10, minimum 1, maximum 30
                        const value = isNaN(parsedValue) ? 10 : Math.max(1, Math.min(30, parsedValue));
                        this.data.abilityScores[ability][source] = value;
                    } else {
                        // Modifiers (race, asi, feat, magic): can be 0 or negative, validate range
                        const value = isNaN(parsedValue) ? 0 : Math.max(-10, Math.min(20, parsedValue));
                        this.data.abilityScores[ability][source] = value;
                    }

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

        const classEl = document.getElementById('characterClass') as HTMLInputElement;
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
        const shield = document.getElementById('shield') as HTMLInputElement;
        if (shield) shield.checked = this.data.shield || false;
        this.updateDisplayedArmorClass(); // Display AC with shield bonus
        
        const initiative = document.getElementById('initiative') as HTMLInputElement;
        if (initiative) initiative.value = this.data.initiative.toString();
        const speed = document.getElementById('speed') as HTMLInputElement;
        if (speed) speed.value = this.data.speed.toString();
        const size = document.getElementById('size') as HTMLInputElement;
        if (size) size.value = this.data.size || '';
        const proficiencyBonus = document.getElementById('proficiencyBonus') as HTMLInputElement;
        if (proficiencyBonus) proficiencyBonus.value = (this.data.proficiencyBonus || 2).toString();
        const passivePerception = document.getElementById('passivePerception') as HTMLInputElement;
        if (passivePerception) passivePerception.value = (this.data.passivePerception || 10).toString();
        
        // Update calculated to-hit bonuses
        this.updateToHitBonuses();
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

        // Load and display character image
        this.loadCharacterImage();
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

    private createSkillRow(skill: { id: string; name: string; ability: string; modifier: string }): HTMLElement {
        const row = document.createElement('div');
        row.className = 'skill-row';
        row.dataset.skillId = skill.id;

        row.innerHTML = `
            <input type="text" class="skill-name" value="${this.escapeHtml(skill.name)}" data-skill-id="${skill.id}" placeholder="Skill name">
            <select class="skill-ability-select" data-skill-id="${skill.id}">
                <option value="str" ${skill.ability === 'str' ? 'selected' : ''}>STR</option>
                <option value="dex" ${skill.ability === 'dex' ? 'selected' : ''}>DEX</option>
                <option value="con" ${skill.ability === 'con' ? 'selected' : ''}>CON</option>
                <option value="int" ${skill.ability === 'int' ? 'selected' : ''}>INT</option>
                <option value="wis" ${skill.ability === 'wis' ? 'selected' : ''}>WIS</option>
                <option value="cha" ${skill.ability === 'cha' ? 'selected' : ''}>CHA</option>
            </select>
            <input type="text" class="skill-modifier" value="${this.escapeHtml(skill.modifier || '+0')}" data-skill-id="${skill.id}" placeholder="+0" aria-label="Skill modifier">
            <button type="button" class="remove-btn" data-skill-id="${skill.id}" aria-label="Remove skill">×</button>
        `;

        // Add event listeners
        const nameInput = row.querySelector('.skill-name') as HTMLInputElement;
        const abilitySelect = row.querySelector('.skill-ability-select') as HTMLSelectElement;
        const modifierInput = row.querySelector('.skill-modifier') as HTMLInputElement;
        const removeBtn = row.querySelector('.remove-btn') as HTMLButtonElement;

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

    private createSpellRow(spell: { id: string; name: string; level: string; castingTime: string; range: string; duration: string; notes: string }): HTMLElement {
        const row = document.createElement('tr');
        row.dataset.spellId = spell.id;

        // Define spell fields in a data-driven way
        const spellFields = [
            { key: 'name' as const, placeholder: 'Fire Bolt', className: 'spell-name' },
            { key: 'level' as const, placeholder: 'Cantrip', className: 'spell-level' },
            { key: 'castingTime' as const, placeholder: '1 action', className: 'spell-casting-time' },
            { key: 'range' as const, placeholder: '120 ft', className: 'spell-range' },
            { key: 'duration' as const, placeholder: 'Instantaneous', className: 'spell-duration' },
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
            range: '',
            duration: '',
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

    // Local Storage Methods

    private saveToLocalStorage(): void {
        try {
            // Save character data
            localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(this.data));
            
            // Save layout data
            const layoutData = this.layoutManager.getLayout();
            localStorage.setItem(this.LOCAL_LAYOUT_KEY, JSON.stringify(layoutData));
            
            // Save Google Drive file info
            const driveFileInfo = {
                fileId: this.currentDriveFileId,
                fileName: this.currentDriveFileName
            };
            localStorage.setItem(this.LOCAL_DRIVE_FILE_KEY, JSON.stringify(driveFileInfo));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    private loadFromLocalStorage(): void {
        try {
            // Load character data
            const savedData = localStorage.getItem(this.LOCAL_STORAGE_KEY);
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                this.data = this.validateAndMigrateData(parsedData);
                console.log('Loaded character from localStorage');
            }

            // Load layout data
            const savedLayout = localStorage.getItem(this.LOCAL_LAYOUT_KEY);
            if (savedLayout) {
                const layoutData = JSON.parse(savedLayout);
                this.layoutManager.setLayout(layoutData);
                console.log('Loaded layout from localStorage');
            }

            // Load Google Drive file info
            const savedDriveInfo = localStorage.getItem(this.LOCAL_DRIVE_FILE_KEY);
            if (savedDriveInfo) {
                const driveInfo = JSON.parse(savedDriveInfo);
                this.currentDriveFileId = driveInfo.fileId || null;
                this.currentDriveFileName = driveInfo.fileName || null;
                console.log('Loaded Drive file info from localStorage:', driveInfo);
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
    }

    // Google Drive Integration Methods

    private initializeGoogleDrive(): void {
        try {
            this.googleDriveManager = new GoogleDriveManager();
            
            // Listen for sign-in/sign-out events
            window.addEventListener('google-signed-in', () => {
                this.updateDriveButtonVisibility();
                this.showSaveStatus('saved', 'Signed in to Google Drive');
                setTimeout(() => {
                    const statusEl = document.getElementById('saveStatus');
                    if (statusEl) {
                        statusEl.textContent = '';
                        statusEl.className = 'save-status';
                    }
                }, 2000);
            });
            
            window.addEventListener('google-signed-out', () => this.updateDriveButtonVisibility());
            
            // Initial button visibility
            this.updateDriveButtonVisibility();
        } catch (error) {
            console.error('Failed to initialize Google Drive manager:', error);
        }
    }

    private updateDriveButtonVisibility(): void {
        const signInBtn = document.getElementById('signInBtn');
        const signOutBtn = document.getElementById('signOutBtn');
        const saveToDriveBtn = document.getElementById('saveToDriveBtn');
        const saveAsNewBtn = document.getElementById('saveAsNewBtn');
        const loadFromDriveBtn = document.getElementById('loadFromDriveBtn');

        const isSignedIn = this.googleDriveManager?.isSignedIn() || false;

        if (signInBtn) signInBtn.style.display = isSignedIn ? 'none' : 'inline-block';
        if (signOutBtn) signOutBtn.style.display = isSignedIn ? 'inline-block' : 'none';
        if (saveToDriveBtn) saveToDriveBtn.style.display = isSignedIn ? 'inline-block' : 'none';
        if (saveAsNewBtn) saveAsNewBtn.style.display = isSignedIn ? 'inline-block' : 'none';
        if (loadFromDriveBtn) loadFromDriveBtn.style.display = isSignedIn ? 'inline-block' : 'none';
    }

    private async saveToGoogleDrive(): Promise<void> {
        if (!this.googleDriveManager || !this.googleDriveManager.isSignedIn()) {
            this.showSaveStatus('error', 'Please sign in to Google Drive first');
            return;
        }

        this.setDriveButtonsEnabled(false);
        this.showSaveStatus('saving', 'Saving to Google Drive...');

        try {
            // Prepare data to save
            const fileData = {
                'character-definition': this.data,
                'sheet-layout': this.layoutManager.getLayout()
            };

            const dataToSave = JSON.stringify(fileData, null, 2);
            
            // Use stored filename if available, otherwise generate from character name
            const fileName = this.currentDriveFileName || (this.data.characterName
                ? `${this.data.characterName}-character-sheet.json`
                : 'character-sheet.json');

            const result = await this.googleDriveManager.saveToGoogleDrive(
                fileName,
                dataToSave,
                this.currentDriveFileId || undefined
            );

            this.currentDriveFileId = result.fileId;
            this.currentDriveFileName = fileName;
            this.showSaveStatus('saved', 'Saved to Google Drive');
            setTimeout(() => {
                const statusEl = document.getElementById('saveStatus');
                if (statusEl) {
                    statusEl.textContent = '';
                    statusEl.className = 'save-status';
                }
            }, 2000);
        } catch (error) {
            console.error('Error saving to Google Drive:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.showSaveStatus('error', `Failed to save to Google Drive: ${errorMessage}`);
        } finally {
            this.setDriveButtonsEnabled(true);
        }
    }

    private async saveAsNewToGoogleDrive(): Promise<void> {
        if (!this.googleDriveManager || !this.googleDriveManager.isSignedIn()) {
            this.showSaveStatus('error', 'Please sign in to Google Drive first');
            return;
        }

        // Prompt for filename
        const currentName = this.data.characterName || 'character';
        const suggestedName = `${currentName}-character-sheet.json`;
        const fileName = prompt('Enter filename for the new character sheet:', suggestedName);

        if (!fileName) {
            // User cancelled
            return;
        }

        // Validate filename
        const trimmedFileName = fileName.trim();
        if (!trimmedFileName) {
            this.showSaveStatus('error', 'Filename cannot be empty');
            return;
        }

        // Ensure .json extension
        const finalFileName = trimmedFileName.endsWith('.json') ? trimmedFileName : `${trimmedFileName}.json`;

        this.setDriveButtonsEnabled(false);
        this.showSaveStatus('saving', 'Saving as new file...');

        try {
            // Prepare data to save
            const fileData = {
                'character-definition': this.data,
                'sheet-layout': this.layoutManager.getLayout()
            };

            const dataToSave = JSON.stringify(fileData, null, 2);

            // Save without fileId to create a new file
            const result = await this.googleDriveManager.saveToGoogleDrive(
                finalFileName,
                dataToSave,
                undefined // No fileId = create new file
            );

            // Update current file ID and filename to the new file
            this.currentDriveFileId = result.fileId;
            this.currentDriveFileName = finalFileName;
            this.showSaveStatus('saved', 'Saved as new file');
            setTimeout(() => {
                const statusEl = document.getElementById('saveStatus');
                if (statusEl) {
                    statusEl.textContent = '';
                    statusEl.className = 'save-status';
                }
            }, 2000);
        } catch (error) {
            console.error('Error saving as new to Google Drive:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.showSaveStatus('error', `Failed to save: ${errorMessage}`);
        } finally {
            this.setDriveButtonsEnabled(true);
        }
    }

    private async showGoogleDriveFilePicker(): Promise<void> {
        if (!this.googleDriveManager || !this.googleDriveManager.isSignedIn()) {
            this.showSaveStatus('error', 'Please sign in to Google Drive first');
            return;
        }

        this.setDriveButtonsEnabled(false);
        this.showSaveStatus('saving', 'Loading file list...');

        try {
            const files = await this.googleDriveManager.listFiles();
            this.displayFilePickerModal(files);
        } catch (error) {
            console.error('Error loading file list:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.showSaveStatus('error', `Failed to load files: ${errorMessage}`);
        } finally {
            this.setDriveButtonsEnabled(true);
        }
    }

    private displayFilePickerModal(files: DriveFile[]): void {
        const modal = document.getElementById('googleDriveModal');
        const fileList = document.getElementById('googleDriveFileList');

        if (!modal || !fileList) {
            this.showSaveStatus('error', 'File picker modal not found');
            return;
        }

        // Clear previous list
        fileList.innerHTML = '';

        if (files.length === 0) {
            fileList.innerHTML = '<div class="no-files">No character sheets found in Google Drive</div>';
        } else {
            files.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'drive-file-item';

                const modifiedDate = new Date(file.modifiedTime);
                const dateStr = modifiedDate.toLocaleDateString() + ' ' + modifiedDate.toLocaleTimeString();

                fileItem.innerHTML = `
                    <div class="file-info">
                        <div class="file-name">${this.escapeHtml(file.name)}</div>
                        <div class="file-date">Modified: ${dateStr}</div>
                    </div>
                    <div class="file-actions">
                        <button type="button" class="load-file-btn" data-file-id="${file.id}">Load</button>
                        <button type="button" class="delete-file-btn" data-file-id="${file.id}">Delete</button>
                    </div>
                `;

                // Load button
                const loadBtn = fileItem.querySelector('.load-file-btn');
                if (loadBtn) {
                    loadBtn.addEventListener('click', () => this.loadFromGoogleDrive(file.id, file.name));
                }

                // Delete button
                const deleteBtn = fileItem.querySelector('.delete-file-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => this.deleteGoogleDriveFile(file.id, file.name));
                }

                fileList.appendChild(fileItem);
            });
        }

        // Show modal
        modal.style.display = 'block';

        // Clear status
        const statusEl = document.getElementById('saveStatus');
        if (statusEl) {
            statusEl.textContent = '';
            statusEl.className = 'save-status';
        }
    }

    private async loadFromGoogleDrive(fileId: string, fileName?: string): Promise<void> {
        if (!this.googleDriveManager) {
            this.showSaveStatus('error', 'Google Drive not configured');
            return;
        }

        this.setDriveButtonsEnabled(false);
        this.showSaveStatus('saving', 'Loading from Google Drive...');

        try {
            const result = await this.googleDriveManager.loadFromGoogleDrive(fileId);
            const fileData = JSON.parse(result.content);

            // Handle both old format and new format
            let characterData: any;
            let layoutData: LayoutData | undefined;

            if (fileData['character-definition'] && fileData['sheet-layout']) {
                characterData = fileData['character-definition'];
                layoutData = fileData['sheet-layout'];
            } else {
                characterData = fileData;
            }

            // Apply layout if available
            if (layoutData) {
                this.layoutManager.setLayout(layoutData);
            }

            // Validate and merge with defaults
            this.data = this.validateAndMigrateData(characterData);
            this.currentDriveFileId = fileId;
            this.currentDriveFileName = fileName || null;

            // Reset history after loading
            this.history = [];
            this.historyIndex = -1;
            this.pushHistory();

            // Update UI
            this.renderSkills();
            this.renderWeapons();
            this.renderSpells();
            this.updateAll();
            this.updateHistoryButtons();

            // Close modal
            const modal = document.getElementById('googleDriveModal');
            if (modal) {
                modal.style.display = 'none';
            }

            this.showSaveStatus('saved', 'Loaded from Google Drive');
            setTimeout(() => {
                const statusEl = document.getElementById('saveStatus');
                if (statusEl) {
                    statusEl.textContent = '';
                    statusEl.className = 'save-status';
                }
            }, 2000);
        } catch (error) {
            console.error('Error loading from Google Drive:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.showSaveStatus('error', `Failed to load: ${errorMessage}`);
        } finally {
            this.setDriveButtonsEnabled(true);
        }
    }

    private async deleteGoogleDriveFile(fileId: string, fileName: string): Promise<void> {
        if (!this.googleDriveManager) {
            this.showSaveStatus('error', 'Google Drive not configured');
            return;
        }

        if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
            return;
        }

        this.setDriveButtonsEnabled(false);

        try {
            await this.googleDriveManager.deleteFile(fileId);

            // If this was the current file, clear the file ID and filename
            if (this.currentDriveFileId === fileId) {
                this.currentDriveFileId = null;
                this.currentDriveFileName = null;
            }

            // Refresh file list
            this.showGoogleDriveFilePicker();
            this.showSaveStatus('saved', 'File deleted');
        } catch (error) {
            console.error('Error deleting file:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.showSaveStatus('error', `Failed to delete: ${errorMessage}`);
            this.setDriveButtonsEnabled(true);
        }
    }

    private setDriveButtonsEnabled(enabled: boolean): void {
        const saveToDriveBtn = document.getElementById('saveToDriveBtn') as HTMLButtonElement;
        const saveAsNewBtn = document.getElementById('saveAsNewBtn') as HTMLButtonElement;
        const loadFromDriveBtn = document.getElementById('loadFromDriveBtn') as HTMLButtonElement;

        if (saveToDriveBtn) {
            saveToDriveBtn.disabled = !enabled;
        }
        if (saveAsNewBtn) {
            saveAsNewBtn.disabled = !enabled;
        }
        if (loadFromDriveBtn) {
            loadFromDriveBtn.disabled = !enabled;
        }

        // Also disable buttons within the modal
        const modal = document.getElementById('googleDriveModal');
        if (modal) {
            const loadButtons = modal.querySelectorAll('.load-file-btn') as NodeListOf<HTMLButtonElement>;
            const deleteButtons = modal.querySelectorAll('.delete-file-btn') as NodeListOf<HTMLButtonElement>;
            
            loadButtons.forEach(btn => { btn.disabled = !enabled; });
            deleteButtons.forEach(btn => { btn.disabled = !enabled; });
        }
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Character Image Methods
    private async handleImageUpload(file: File): Promise<void> {
        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        const maxSize = 2 * 1024 * 1024; // 2 MB
        if (file.size > maxSize) {
            alert('Image file is too large. Please select an image under 2 MB.');
            return;
        }

        if (!this.googleDriveManager || !this.googleDriveManager.isSignedIn()) {
            alert('Please sign in to Google Drive first to upload images.');
            return;
        }

        this.setDriveButtonsEnabled(false);
        this.showSaveStatus('saving', 'Uploading image...');

        try {
            // Upload to Google Drive
            const fileName = `${this.data.characterName || 'character'}-image-${Date.now()}.${file.name.split('.').pop()}`;
            const result = await this.googleDriveManager.uploadImage(file, fileName);

            // Store file ID in character data
            this.data.characterImageFileId = result.fileId;

            // Cache image locally
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result as string;
                localStorage.setItem(this.LOCAL_IMAGE_KEY, base64);
                this.displayCharacterImage(base64);
                this.showSaveStatus('saved', 'Image uploaded');
                setTimeout(() => {
                    const statusEl = document.getElementById('saveStatus');
                    if (statusEl) {
                        statusEl.textContent = '';
                        statusEl.className = 'save-status';
                    }
                }, 2000);
            };
            reader.readAsDataURL(file);

            this.pushHistory();
        } catch (error) {
            console.error('Error uploading image:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.showSaveStatus('error', `Failed to upload image: ${errorMessage}`);
        } finally {
            this.setDriveButtonsEnabled(true);
        }
    }

    private displayCharacterImage(dataUrl: string): void {
        const imageDisplay = document.getElementById('imageDisplay');
        const removeBtn = document.getElementById('removeImageBtn');

        if (!imageDisplay) return;

        imageDisplay.innerHTML = `<img src="${dataUrl}" alt="Character portrait" class="character-portrait">`;

        if (removeBtn) {
            removeBtn.style.display = 'inline-block';
        }
    }

    private removeCharacterImage(): void {
        this.data.characterImageFileId = null;
        localStorage.removeItem(this.LOCAL_IMAGE_KEY);

        const imageDisplay = document.getElementById('imageDisplay');
        const removeBtn = document.getElementById('removeImageBtn');

        if (imageDisplay) {
            imageDisplay.innerHTML = '<div class="image-placeholder">No image uploaded</div>';
        }

        if (removeBtn) {
            removeBtn.style.display = 'none';
        }

        this.pushHistory();
        this.showSaveStatus('saved', 'Image removed');
        setTimeout(() => {
            const statusEl = document.getElementById('saveStatus');
            if (statusEl) {
                statusEl.textContent = '';
                statusEl.className = 'save-status';
            }
        }, 2000);
    }

    private async loadCharacterImage(): Promise<void> {
        // Try to load from localStorage cache first
        const cachedImage = localStorage.getItem(this.LOCAL_IMAGE_KEY);
        if (cachedImage) {
            this.displayCharacterImage(cachedImage);
            return;
        }

        // If not cached and we have a file ID, fetch from Drive
        if (this.data.characterImageFileId && this.googleDriveManager && this.googleDriveManager.isSignedIn()) {
            try {
                const blob = await this.googleDriveManager.loadImage(this.data.characterImageFileId);
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result as string;
                    localStorage.setItem(this.LOCAL_IMAGE_KEY, base64);
                    this.displayCharacterImage(base64);
                };
                reader.readAsDataURL(blob);
            } catch (error) {
                console.error('Error loading character image:', error);
                // Image might have been deleted from Drive - show placeholder
                const imageDisplay = document.getElementById('imageDisplay');
                if (imageDisplay) {
                    imageDisplay.innerHTML = '<div class="image-placeholder">Image not found (may have been deleted)</div>';
                }
            }
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
