"use strict";
// Layout Manager Class
class LayoutManager {
    constructor(initialLayout) {
        this.saveCallback = null;
        this.layout = initialLayout || this.getDefaultLayout();
        this.applyLayout();
        this.initializeResizeListeners();
    }
    getLayout() {
        return { ...this.layout };
    }
    setLayout(layout) {
        this.layout = layout;
        this.applyLayout();
    }
    setSaveCallback(callback) {
        this.saveCallback = callback;
    }
    getDefaultLayout() {
        return {
            skillsWidth: 250,
            weaponsWidth: 0, // 0 means use default/auto
            proficienciesWidth: 0,
            equipmentWidth: 0
        };
    }
    applyLayout() {
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
    initializeResizeListeners() {
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
    addResizeListener(element, callback) {
        let lastWidth = element.offsetWidth;
        let isResizing = false;
        let resizeInterval = null;
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
        }
        else {
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
    saveLayout() {
        // Notify parent to save (will be handled by CharacterSheet)
        if (this.saveCallback) {
            this.saveCallback();
        }
    }
}
class CharacterSheet {
    constructor() {
        this.STORAGE_KEY = 'dnd-character-sheet';
        this.nextSkillId = 100;
        this.nextWeaponId = 100;
        this.nextSpellId = 100;
        // Initialize layout manager first (will be updated with saved layout in loadData)
        this.layoutManager = new LayoutManager();
        this.layoutManager.setSaveCallback(() => {
            // Layout changed - trigger save if user wants to save
            // For now, we'll save layout when user clicks Save button
        });
        this.data = this.loadData();
        this.initializeEventListeners();
        this.renderSkills();
        this.renderWeapons();
        this.renderSpells();
        this.updateAll();
    }
    loadData() {
        // Try to load from localStorage first (for backward compatibility)
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                const fileData = JSON.parse(saved);
                // Handle both old format (direct data) and new format (with character-definition and sheet-layout)
                let characterData;
                let layoutData;
                if (fileData['character-definition'] && fileData['sheet-layout']) {
                    // New format
                    characterData = fileData['character-definition'];
                    layoutData = fileData['sheet-layout'];
                }
                else {
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
                    const skillNames = {
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
                    const abilityMap = {
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
                        proficient: proficient,
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
                // Merge with defaults to ensure all fields exist
                return this.mergeWithDefaults(characterData);
            }
            catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
        return this.getDefaultData();
    }
    mergeAbilityScores(defaultScores, savedScores) {
        // Handle migration from old structure (single number per ability)
        if (savedScores && typeof savedScores.str === 'number') {
            // Old format - convert to new format
            const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
            const result = {};
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
        const result = {};
        const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
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
    mergeWithDefaults(data) {
        const defaults = this.getDefaultData();
        // Helper to only include defined values
        const mergeDefined = (defaultVal, savedVal) => {
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
    getDefaultData() {
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
            },
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
    initializeEventListeners() {
        // Basic Info
        this.addInputListener('characterName', (v) => this.data.characterName = v);
        this.addInputListener('playerName', (v) => this.data.playerName = v);
        this.addInputListener('race', (v) => this.data.race = v);
        this.addInputListener('level', (v) => {
            this.data.level = parseInt(v) || 1;
        });
        this.addInputListener('background', (v) => this.data.background = v);
        this.addInputListener('subclass', (v) => this.data.subclass = v);
        this.addInputListener('alignment', (v) => this.data.alignment = v);
        this.addInputListener('experience', (v) => this.data.experience = parseInt(v) || 0);
        // Ability Scores - Base
        this.addInputListener('strBase', (v) => {
            this.data.abilityScores.str.base = parseInt(v) || 10;
            this.updateAbilityScore('str');
        });
        this.addInputListener('dexBase', (v) => {
            this.data.abilityScores.dex.base = parseInt(v) || 10;
            this.updateAbilityScore('dex');
        });
        this.addInputListener('conBase', (v) => {
            this.data.abilityScores.con.base = parseInt(v) || 10;
            this.updateAbilityScore('con');
        });
        this.addInputListener('intBase', (v) => {
            this.data.abilityScores.int.base = parseInt(v) || 10;
            this.updateAbilityScore('int');
        });
        this.addInputListener('wisBase', (v) => {
            this.data.abilityScores.wis.base = parseInt(v) || 10;
            this.updateAbilityScore('wis');
        });
        this.addInputListener('chaBase', (v) => {
            this.data.abilityScores.cha.base = parseInt(v) || 10;
            this.updateAbilityScore('cha');
        });
        // Ability Scores - Race
        this.addInputListener('strRace', (v) => {
            this.data.abilityScores.str.race = parseInt(v) || 0;
            this.updateAbilityScore('str');
        });
        this.addInputListener('dexRace', (v) => {
            this.data.abilityScores.dex.race = parseInt(v) || 0;
            this.updateAbilityScore('dex');
        });
        this.addInputListener('conRace', (v) => {
            this.data.abilityScores.con.race = parseInt(v) || 0;
            this.updateAbilityScore('con');
        });
        this.addInputListener('intRace', (v) => {
            this.data.abilityScores.int.race = parseInt(v) || 0;
            this.updateAbilityScore('int');
        });
        this.addInputListener('wisRace', (v) => {
            this.data.abilityScores.wis.race = parseInt(v) || 0;
            this.updateAbilityScore('wis');
        });
        this.addInputListener('chaRace', (v) => {
            this.data.abilityScores.cha.race = parseInt(v) || 0;
            this.updateAbilityScore('cha');
        });
        // Ability Scores - ASI
        this.addInputListener('strASI', (v) => {
            this.data.abilityScores.str.asi = parseInt(v) || 0;
            this.updateAbilityScore('str');
        });
        this.addInputListener('dexASI', (v) => {
            this.data.abilityScores.dex.asi = parseInt(v) || 0;
            this.updateAbilityScore('dex');
        });
        this.addInputListener('conASI', (v) => {
            this.data.abilityScores.con.asi = parseInt(v) || 0;
            this.updateAbilityScore('con');
        });
        this.addInputListener('intASI', (v) => {
            this.data.abilityScores.int.asi = parseInt(v) || 0;
            this.updateAbilityScore('int');
        });
        this.addInputListener('wisASI', (v) => {
            this.data.abilityScores.wis.asi = parseInt(v) || 0;
            this.updateAbilityScore('wis');
        });
        this.addInputListener('chaASI', (v) => {
            this.data.abilityScores.cha.asi = parseInt(v) || 0;
            this.updateAbilityScore('cha');
        });
        // Ability Scores - Feat
        this.addInputListener('strFeat', (v) => {
            this.data.abilityScores.str.feat = parseInt(v) || 0;
            this.updateAbilityScore('str');
        });
        this.addInputListener('dexFeat', (v) => {
            this.data.abilityScores.dex.feat = parseInt(v) || 0;
            this.updateAbilityScore('dex');
        });
        this.addInputListener('conFeat', (v) => {
            this.data.abilityScores.con.feat = parseInt(v) || 0;
            this.updateAbilityScore('con');
        });
        this.addInputListener('intFeat', (v) => {
            this.data.abilityScores.int.feat = parseInt(v) || 0;
            this.updateAbilityScore('int');
        });
        this.addInputListener('wisFeat', (v) => {
            this.data.abilityScores.wis.feat = parseInt(v) || 0;
            this.updateAbilityScore('wis');
        });
        this.addInputListener('chaFeat', (v) => {
            this.data.abilityScores.cha.feat = parseInt(v) || 0;
            this.updateAbilityScore('cha');
        });
        // Ability Scores - Magic
        this.addInputListener('strMagic', (v) => {
            this.data.abilityScores.str.magic = parseInt(v) || 0;
            this.updateAbilityScore('str');
        });
        this.addInputListener('dexMagic', (v) => {
            this.data.abilityScores.dex.magic = parseInt(v) || 0;
            this.updateAbilityScore('dex');
        });
        this.addInputListener('conMagic', (v) => {
            this.data.abilityScores.con.magic = parseInt(v) || 0;
            this.updateAbilityScore('con');
        });
        this.addInputListener('intMagic', (v) => {
            this.data.abilityScores.int.magic = parseInt(v) || 0;
            this.updateAbilityScore('int');
        });
        this.addInputListener('wisMagic', (v) => {
            this.data.abilityScores.wis.magic = parseInt(v) || 0;
            this.updateAbilityScore('wis');
        });
        this.addInputListener('chaMagic', (v) => {
            this.data.abilityScores.cha.magic = parseInt(v) || 0;
            this.updateAbilityScore('cha');
        });
        // Ability Modifiers (auto-calculated, but editable)
        this.addInputListener('strMod', (v) => this.data.abilityModifiers.str = v);
        this.addInputListener('dexMod', (v) => this.data.abilityModifiers.dex = v);
        this.addInputListener('conMod', (v) => this.data.abilityModifiers.con = v);
        this.addInputListener('intMod', (v) => this.data.abilityModifiers.int = v);
        this.addInputListener('wisMod', (v) => this.data.abilityModifiers.wis = v);
        this.addInputListener('chaMod', (v) => this.data.abilityModifiers.cha = v);
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
            const languagesPage2 = document.getElementById('languagesPage2');
            if (languagesPage2)
                languagesPage2.value = v;
        });
        this.addTextareaListener('languagesPage2', (v) => {
            this.data.languages = v;
            // Sync with page 1 languages field
            const languages = document.getElementById('languages');
            if (languages)
                languages.value = v;
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
    addInputListener(id, callback) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', () => {
                callback(element.value);
            });
        }
    }
    calculateAbilityModifier(score) {
        // D&D 2024 rules: modifier = (score - 10) / 2, rounded down
        const modifier = Math.floor((score - 10) / 2);
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    }
    calculateTotalAbilityScore(ability) {
        const scores = this.data.abilityScores[ability];
        return scores.base + scores.race + scores.asi + scores.feat + scores.magic;
    }
    updateAbilityScore(ability) {
        const total = this.calculateTotalAbilityScore(ability);
        const modifier = this.calculateAbilityModifier(total);
        // Update total display
        const totalEl = document.getElementById(`${ability}Total`);
        if (totalEl) {
            totalEl.textContent = total.toString();
        }
        // Update modifier (auto-calculated, but field is still editable)
        const modEl = document.getElementById(`${ability}Mod`);
        if (modEl) {
            modEl.value = modifier;
            this.data.abilityModifiers[ability] = modifier;
        }
    }
    addTextareaListener(id, callback) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', () => {
                callback(element.value);
            });
            // Also listen to blur to catch any changes
            element.addEventListener('blur', () => {
                callback(element.value);
            });
        }
    }
    addCheckboxListener(id, callback) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => {
                callback(element.checked);
            });
        }
    }
    updateAll() {
        // Populate all fields with current data
        const characterName = document.getElementById('characterName');
        if (characterName)
            characterName.value = this.data.characterName;
        const playerName = document.getElementById('playerName');
        if (playerName)
            playerName.value = this.data.playerName;
        const race = document.getElementById('race');
        if (race)
            race.value = this.data.race;
        const classEl = document.getElementById('class');
        if (classEl)
            classEl.value = this.data.class;
        const level = document.getElementById('level');
        if (level)
            level.value = this.data.level.toString();
        const background = document.getElementById('background');
        if (background)
            background.value = this.data.background;
        const subclass = document.getElementById('subclass');
        if (subclass)
            subclass.value = this.data.subclass || '';
        const alignment = document.getElementById('alignment');
        if (alignment)
            alignment.value = this.data.alignment;
        const experience = document.getElementById('experience');
        if (experience)
            experience.value = this.data.experience.toString();
        // Ability Scores - populate all fields and calculate totals/modifiers
        const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        abilities.forEach(ability => {
            const scores = this.data.abilityScores[ability];
            // Populate individual fields
            const baseEl = document.getElementById(`${ability}Base`);
            if (baseEl)
                baseEl.value = scores.base.toString();
            const raceEl = document.getElementById(`${ability}Race`);
            if (raceEl)
                raceEl.value = scores.race.toString();
            const asiEl = document.getElementById(`${ability}ASI`);
            if (asiEl)
                asiEl.value = scores.asi.toString();
            const featEl = document.getElementById(`${ability}Feat`);
            if (featEl)
                featEl.value = scores.feat.toString();
            const magicEl = document.getElementById(`${ability}Magic`);
            if (magicEl)
                magicEl.value = scores.magic.toString();
            // Calculate and display total
            this.updateAbilityScore(ability);
        });
        // Saving Throws
        const strSaveProf = document.getElementById('strSaveProf');
        if (strSaveProf)
            strSaveProf.checked = this.data.savingThrows.str;
        const dexSaveProf = document.getElementById('dexSaveProf');
        if (dexSaveProf)
            dexSaveProf.checked = this.data.savingThrows.dex;
        const conSaveProf = document.getElementById('conSaveProf');
        if (conSaveProf)
            conSaveProf.checked = this.data.savingThrows.con;
        const intSaveProf = document.getElementById('intSaveProf');
        if (intSaveProf)
            intSaveProf.checked = this.data.savingThrows.int;
        const wisSaveProf = document.getElementById('wisSaveProf');
        if (wisSaveProf)
            wisSaveProf.checked = this.data.savingThrows.wis;
        const chaSaveProf = document.getElementById('chaSaveProf');
        if (chaSaveProf)
            chaSaveProf.checked = this.data.savingThrows.cha;
        // Combat Stats
        const armorClass = document.getElementById('armorClass');
        if (armorClass)
            armorClass.value = this.data.armorClass.toString();
        const shield = document.getElementById('shield');
        if (shield)
            shield.checked = this.data.shield || false;
        const initiative = document.getElementById('initiative');
        if (initiative)
            initiative.value = this.data.initiative.toString();
        const speed = document.getElementById('speed');
        if (speed)
            speed.value = this.data.speed.toString();
        const size = document.getElementById('size');
        if (size)
            size.value = this.data.size || '';
        const proficiencyBonus = document.getElementById('proficiencyBonus');
        if (proficiencyBonus)
            proficiencyBonus.value = this.data.proficiencyBonus || '+2';
        const passivePerception = document.getElementById('passivePerception');
        if (passivePerception)
            passivePerception.value = (this.data.passivePerception || 10).toString();
        const heroicInspiration = document.getElementById('heroicInspiration');
        if (heroicInspiration)
            heroicInspiration.checked = this.data.heroicInspiration || false;
        const hitPointsMax = document.getElementById('hitPointsMax');
        if (hitPointsMax)
            hitPointsMax.value = this.data.hitPointsMax.toString();
        const hitPointsCurrent = document.getElementById('hitPointsCurrent');
        if (hitPointsCurrent)
            hitPointsCurrent.value = this.data.hitPointsCurrent.toString();
        const hitPointsTemp = document.getElementById('hitPointsTemp');
        if (hitPointsTemp)
            hitPointsTemp.value = this.data.hitPointsTemp.toString();
        const hitDiceSpent = document.getElementById('hitDiceSpent');
        if (hitDiceSpent)
            hitDiceSpent.value = (this.data.hitDiceSpent || 0).toString();
        const hitDice = document.getElementById('hitDice');
        if (hitDice)
            hitDice.value = this.data.hitDice || '';
        // Death Saves
        const deathSave1 = document.getElementById('deathSave1');
        if (deathSave1)
            deathSave1.checked = this.data.deathSaves.success[0];
        const deathSave2 = document.getElementById('deathSave2');
        if (deathSave2)
            deathSave2.checked = this.data.deathSaves.success[1];
        const deathSave3 = document.getElementById('deathSave3');
        if (deathSave3)
            deathSave3.checked = this.data.deathSaves.success[2];
        const deathFail1 = document.getElementById('deathFail1');
        if (deathFail1)
            deathFail1.checked = this.data.deathSaves.failure[0];
        const deathFail2 = document.getElementById('deathFail2');
        if (deathFail2)
            deathFail2.checked = this.data.deathSaves.failure[1];
        const deathFail3 = document.getElementById('deathFail3');
        if (deathFail3)
            deathFail3.checked = this.data.deathSaves.failure[2];
        // Skills - rendered dynamically, no need to update here
        // Features & Spells
        const features = document.getElementById('features');
        if (features)
            features.value = this.data.features || '';
        const feats = document.getElementById('feats');
        if (feats)
            feats.value = this.data.feats || '';
        const speciesTraits = document.getElementById('speciesTraits');
        if (speciesTraits)
            speciesTraits.value = this.data.speciesTraits || '';
        const spellcastingAbility = document.getElementById('spellcastingAbility');
        if (spellcastingAbility)
            spellcastingAbility.value = this.data.spellcastingAbility || '';
        const spellSaveDC = document.getElementById('spellSaveDC');
        if (spellSaveDC)
            spellSaveDC.value = (this.data.spellSaveDC || 0).toString();
        const spellAttackBonus = document.getElementById('spellAttackBonus');
        if (spellAttackBonus)
            spellAttackBonus.value = this.data.spellAttackBonus || '+0';
        const spellSlots1 = document.getElementById('spellSlots1');
        if (spellSlots1)
            spellSlots1.value = this.data.spellSlots.level1.current.toString();
        const spellSlots1Max = document.getElementById('spellSlots1Max');
        if (spellSlots1Max)
            spellSlots1Max.value = this.data.spellSlots.level1.max.toString();
        const spellSlots2 = document.getElementById('spellSlots2');
        if (spellSlots2)
            spellSlots2.value = this.data.spellSlots.level2.current.toString();
        const spellSlots2Max = document.getElementById('spellSlots2Max');
        if (spellSlots2Max)
            spellSlots2Max.value = this.data.spellSlots.level2.max.toString();
        const spellSlots3 = document.getElementById('spellSlots3');
        if (spellSlots3)
            spellSlots3.value = (this.data.spellSlots.level3?.current || 0).toString();
        const spellSlots3Max = document.getElementById('spellSlots3Max');
        if (spellSlots3Max)
            spellSlots3Max.value = (this.data.spellSlots.level3?.max || 0).toString();
        const spellSlots4 = document.getElementById('spellSlots4');
        if (spellSlots4)
            spellSlots4.value = (this.data.spellSlots.level4?.current || 0).toString();
        const spellSlots4Max = document.getElementById('spellSlots4Max');
        if (spellSlots4Max)
            spellSlots4Max.value = (this.data.spellSlots.level4?.max || 0).toString();
        const spellSlots5 = document.getElementById('spellSlots5');
        if (spellSlots5)
            spellSlots5.value = (this.data.spellSlots.level5?.current || 0).toString();
        const spellSlots5Max = document.getElementById('spellSlots5Max');
        if (spellSlots5Max)
            spellSlots5Max.value = (this.data.spellSlots.level5?.max || 0).toString();
        const spellSlots6 = document.getElementById('spellSlots6');
        if (spellSlots6)
            spellSlots6.value = (this.data.spellSlots.level6?.current || 0).toString();
        const spellSlots6Max = document.getElementById('spellSlots6Max');
        if (spellSlots6Max)
            spellSlots6Max.value = (this.data.spellSlots.level6?.max || 0).toString();
        const spellSlots7 = document.getElementById('spellSlots7');
        if (spellSlots7)
            spellSlots7.value = (this.data.spellSlots.level7?.current || 0).toString();
        const spellSlots7Max = document.getElementById('spellSlots7Max');
        if (spellSlots7Max)
            spellSlots7Max.value = (this.data.spellSlots.level7?.max || 0).toString();
        const spellSlots8 = document.getElementById('spellSlots8');
        if (spellSlots8)
            spellSlots8.value = (this.data.spellSlots.level8?.current || 0).toString();
        const spellSlots8Max = document.getElementById('spellSlots8Max');
        if (spellSlots8Max)
            spellSlots8Max.value = (this.data.spellSlots.level8?.max || 0).toString();
        const spellSlots9 = document.getElementById('spellSlots9');
        if (spellSlots9)
            spellSlots9.value = (this.data.spellSlots.level9?.current || 0).toString();
        const spellSlots9Max = document.getElementById('spellSlots9Max');
        if (spellSlots9Max)
            spellSlots9Max.value = (this.data.spellSlots.level9?.max || 0).toString();
        const knownSpells = document.getElementById('knownSpells');
        if (knownSpells)
            knownSpells.value = this.data.knownSpells || '';
        // Equipment & Proficiencies
        const equipment = document.getElementById('equipment');
        if (equipment) {
            const value = (this.data.equipment !== undefined && this.data.equipment !== null) ? this.data.equipment : '';
            equipment.value = value;
        }
        const equipmentDetail = document.getElementById('equipmentDetail');
        if (equipmentDetail)
            equipmentDetail.value = (this.data.equipmentDetail !== undefined && this.data.equipmentDetail !== null) ? this.data.equipmentDetail : '';
        const armorProficiencies = document.getElementById('armorProficiencies');
        if (armorProficiencies) {
            const value = (this.data.armorProficiencies !== undefined && this.data.armorProficiencies !== null) ? this.data.armorProficiencies : '';
            armorProficiencies.value = value;
        }
        const weaponProficiencies = document.getElementById('weaponProficiencies');
        if (weaponProficiencies)
            weaponProficiencies.value = (this.data.weaponProficiencies !== undefined && this.data.weaponProficiencies !== null) ? this.data.weaponProficiencies : '';
        const toolProficiencies = document.getElementById('toolProficiencies');
        if (toolProficiencies)
            toolProficiencies.value = (this.data.toolProficiencies !== undefined && this.data.toolProficiencies !== null) ? this.data.toolProficiencies : '';
        const languages = document.getElementById('languages');
        if (languages)
            languages.value = (this.data.languages !== undefined && this.data.languages !== null) ? this.data.languages : '';
        const languagesPage2 = document.getElementById('languagesPage2');
        if (languagesPage2)
            languagesPage2.value = (this.data.languages !== undefined && this.data.languages !== null) ? this.data.languages : '';
        // Coins
        const coinCP = document.getElementById('coinCP');
        if (coinCP)
            coinCP.value = (this.data.coins?.cp || 0).toString();
        const coinSP = document.getElementById('coinSP');
        if (coinSP)
            coinSP.value = (this.data.coins?.sp || 0).toString();
        const coinEP = document.getElementById('coinEP');
        if (coinEP)
            coinEP.value = (this.data.coins?.ep || 0).toString();
        const coinGP = document.getElementById('coinGP');
        if (coinGP)
            coinGP.value = (this.data.coins?.gp || 0).toString();
        const coinPP = document.getElementById('coinPP');
        if (coinPP)
            coinPP.value = (this.data.coins?.pp || 0).toString();
        // Backstory & Appearance
        const backstory = document.getElementById('backstory');
        if (backstory)
            backstory.value = this.data.backstory || '';
        const appearance = document.getElementById('appearance');
        if (appearance)
            appearance.value = this.data.appearance || '';
        const notes = document.getElementById('notes');
        if (notes)
            notes.value = this.data.notes || '';
        // Ensure skills, weapons, and spells are rendered
        this.renderSkills();
        this.renderWeapons();
        this.renderSpells();
    }
    saveData() {
        this.showSaveStatus('saving', 'Saving...');
        try {
            // Ensure all proficiency fields are captured from DOM before saving
            const armorProficiencies = document.getElementById('armorProficiencies');
            if (armorProficiencies) {
                this.data.armorProficiencies = armorProficiencies.value;
            }
            const weaponProficiencies = document.getElementById('weaponProficiencies');
            if (weaponProficiencies)
                this.data.weaponProficiencies = weaponProficiencies.value;
            const toolProficiencies = document.getElementById('toolProficiencies');
            if (toolProficiencies)
                this.data.toolProficiencies = toolProficiencies.value;
            const languages = document.getElementById('languages');
            if (languages)
                this.data.languages = languages.value;
            const equipment = document.getElementById('equipment');
            if (equipment)
                this.data.equipment = equipment.value;
            // Capture current layout state from DOM before saving
            const skillsSection = document.getElementById('skillsSection');
            const weaponsSection = document.getElementById('weaponsSection');
            const proficienciesSection = document.getElementById('proficienciesSection');
            const equipmentSection = document.getElementById('equipmentSection');
            const currentLayout = {
                skillsWidth: skillsSection ? skillsSection.offsetWidth : 250,
                weaponsWidth: weaponsSection ? weaponsSection.offsetWidth : 0,
                proficienciesWidth: proficienciesSection ? proficienciesSection.offsetWidth : 0,
                equipmentWidth: equipmentSection ? equipmentSection.offsetWidth : 0
            };
            // Update layout manager with current state
            this.layoutManager.setLayout(currentLayout);
            // Save to file using File System Access API
            this.saveToFile();
        }
        catch (e) {
            console.error('Error saving data:', e);
            this.showSaveStatus('error', 'Save failed');
        }
    }
    async saveToFile() {
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
                    const fileHandle = await window.showSaveFilePicker({
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
                }
                catch (err) {
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
        }
        catch (e) {
            console.error('Error saving to file:', e);
            this.showSaveStatus('error', 'Save failed');
        }
    }
    renderSkills() {
        const skillsList = document.getElementById('skillsList');
        if (!skillsList)
            return;
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
    createSkillRow(skill) {
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
            <input type="text" class="skill-modifier" value="${skill.modifier || '+0'}" data-skill-id="${skill.id}" placeholder="+0">
            <button type="button" class="remove-btn" data-skill-id="${skill.id}">×</button>
        `;
        // Add event listeners
        const checkbox = row.querySelector('.skill-checkbox');
        const nameInput = row.querySelector('.skill-name');
        const abilitySelect = row.querySelector('.skill-ability-select');
        const modifierInput = row.querySelector('.skill-modifier');
        const removeBtn = row.querySelector('.remove-btn');
        checkbox.addEventListener('change', () => {
            const skillData = this.data.skills.find(s => s.id === skill.id);
            if (skillData) {
                skillData.proficient = checkbox.checked;
            }
        });
        nameInput.addEventListener('input', () => {
            const skillData = this.data.skills.find(s => s.id === skill.id);
            if (skillData) {
                skillData.name = nameInput.value;
            }
        });
        abilitySelect.addEventListener('change', () => {
            const skillData = this.data.skills.find(s => s.id === skill.id);
            if (skillData) {
                skillData.ability = abilitySelect.value;
            }
        });
        modifierInput.addEventListener('input', () => {
            const skillData = this.data.skills.find(s => s.id === skill.id);
            if (skillData)
                skillData.modifier = modifierInput.value;
        });
        removeBtn.addEventListener('click', () => {
            this.removeSkill(skill.id);
        });
        return row;
    }
    addSkill() {
        const newSkill = {
            id: this.nextSkillId.toString(),
            name: '',
            ability: 'str',
            proficient: false,
            modifier: '+0'
        };
        this.data.skills.push(newSkill);
        this.nextSkillId++;
        this.renderSkills();
    }
    removeSkill(id) {
        this.data.skills = this.data.skills.filter(s => s.id !== id);
        this.renderSkills();
    }
    renderWeapons() {
        const weaponsBody = document.getElementById('weaponsTableBody');
        if (!weaponsBody)
            return;
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
    createWeaponRow(weapon) {
        const row = document.createElement('tr');
        row.dataset.weaponId = weapon.id;
        row.innerHTML = `
            <td><input type="text" class="weapon-name" value="${weapon.name}" data-weapon-id="${weapon.id}" placeholder="Weapon name"></td>
            <td><input type="text" class="weapon-atk" value="${weapon.atkBonus}" data-weapon-id="${weapon.id}" placeholder="+6"></td>
            <td><input type="text" class="weapon-damage" value="${weapon.damage}" data-weapon-id="${weapon.id}" placeholder="1d8+3 slashing"></td>
            <td><input type="text" class="weapon-notes" value="${weapon.notes}" data-weapon-id="${weapon.id}" placeholder="Notes"></td>
            <td><button type="button" class="remove-btn" data-weapon-id="${weapon.id}">×</button></td>
        `;
        // Add event listeners
        const nameInput = row.querySelector('.weapon-name');
        const atkInput = row.querySelector('.weapon-atk');
        const damageInput = row.querySelector('.weapon-damage');
        const notesInput = row.querySelector('.weapon-notes');
        const removeBtn = row.querySelector('.remove-btn');
        nameInput.addEventListener('input', () => {
            const weaponData = this.data.weapons.find(w => w.id === weapon.id);
            if (weaponData)
                weaponData.name = nameInput.value;
        });
        atkInput.addEventListener('input', () => {
            const weaponData = this.data.weapons.find(w => w.id === weapon.id);
            if (weaponData)
                weaponData.atkBonus = atkInput.value;
        });
        damageInput.addEventListener('input', () => {
            const weaponData = this.data.weapons.find(w => w.id === weapon.id);
            if (weaponData)
                weaponData.damage = damageInput.value;
        });
        notesInput.addEventListener('input', () => {
            const weaponData = this.data.weapons.find(w => w.id === weapon.id);
            if (weaponData)
                weaponData.notes = notesInput.value;
        });
        removeBtn.addEventListener('click', () => {
            this.removeWeapon(weapon.id);
        });
        return row;
    }
    async loadFromFile() {
        this.showSaveStatus('saving', 'Loading...');
        try {
            // Check if File System Access API is supported
            if ('showOpenFilePicker' in window) {
                try {
                    const [fileHandle] = await window.showOpenFilePicker({
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
                        let characterData;
                        let layoutData;
                        if (fileData['character-definition'] && fileData['sheet-layout']) {
                            // New format
                            characterData = fileData['character-definition'];
                            layoutData = fileData['sheet-layout'];
                        }
                        else {
                            // Old format - just character data
                            characterData = fileData;
                        }
                        // Apply layout if available
                        if (layoutData) {
                            this.layoutManager.setLayout(layoutData);
                        }
                        // Merge with defaults and load
                        this.data = this.mergeWithDefaults(characterData);
                        this.updateAll();
                        this.showSaveStatus('saved', 'Loaded from file');
                        setTimeout(() => {
                            const statusEl = document.getElementById('saveStatus');
                            if (statusEl) {
                                statusEl.textContent = '';
                                statusEl.className = 'save-status';
                            }
                        }, 2000);
                    }
                    catch (parseErr) {
                        console.error('Error parsing JSON:', parseErr);
                        this.showSaveStatus('error', 'Invalid JSON file');
                    }
                    return;
                }
                catch (err) {
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
            input.onchange = (e) => {
                const target = e.target;
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
                        const text = event.target?.result;
                        if (!text) {
                            throw new Error('File is empty');
                        }
                        const fileData = JSON.parse(text);
                        console.log('Loaded data:', fileData);
                        // Handle both old format (direct data) and new format (with character-definition and sheet-layout)
                        let characterData;
                        let layoutData;
                        if (fileData['character-definition'] && fileData['sheet-layout']) {
                            // New format
                            characterData = fileData['character-definition'];
                            layoutData = fileData['sheet-layout'];
                        }
                        else {
                            // Old format - just character data
                            characterData = fileData;
                        }
                        // Apply layout if available
                        if (layoutData) {
                            this.layoutManager.setLayout(layoutData);
                        }
                        this.data = this.mergeWithDefaults(characterData);
                        this.updateAll();
                        this.showSaveStatus('saved', 'Loaded from file');
                        setTimeout(() => {
                            const statusEl = document.getElementById('saveStatus');
                            if (statusEl) {
                                statusEl.textContent = '';
                                statusEl.className = 'save-status';
                            }
                        }, 2000);
                    }
                    catch (err) {
                        console.error('Error parsing file:', err);
                        this.showSaveStatus('error', `Invalid file: ${err.message || 'Invalid JSON'}`);
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        }
        catch (e) {
            console.error('Error loading from file:', e);
            this.showSaveStatus('error', `Load failed: ${e.message || 'Unknown error'}`);
        }
    }
    addWeapon() {
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
    }
    removeWeapon(id) {
        this.data.weapons = this.data.weapons.filter(w => w.id !== id);
        this.renderWeapons();
    }
    renderSpells() {
        const spellsBody = document.getElementById('spellsTableBody');
        if (!spellsBody)
            return;
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
    createSpellRow(spell) {
        const row = document.createElement('tr');
        row.dataset.spellId = spell.id;
        row.innerHTML = `
            <td><input type="text" class="spell-name" value="${spell.name}" data-spell-id="${spell.id}" placeholder="Fire Bolt"></td>
            <td><input type="text" class="spell-level" value="${spell.level}" data-spell-id="${spell.id}" placeholder="Cantrip"></td>
            <td><input type="text" class="spell-casting-time" value="${spell.castingTime}" data-spell-id="${spell.id}" placeholder="1 action"></td>
            <td><input type="text" class="spell-concentration" value="${spell.concentration}" data-spell-id="${spell.id}" placeholder="Concentration, Ritual"></td>
            <td><input type="text" class="spell-range" value="${spell.range}" data-spell-id="${spell.id}" placeholder="120 ft"></td>
            <td><input type="text" class="spell-material" value="${spell.material}" data-spell-id="${spell.id}" placeholder="Required Material"></td>
            <td><input type="text" class="spell-notes" value="${spell.notes}" data-spell-id="${spell.id}" placeholder="Notes"></td>
            <td><button type="button" class="remove-btn" data-spell-id="${spell.id}">×</button></td>
        `;
        // Add event listeners
        const nameInput = row.querySelector('.spell-name');
        const levelInput = row.querySelector('.spell-level');
        const castingTimeInput = row.querySelector('.spell-casting-time');
        const concentrationInput = row.querySelector('.spell-concentration');
        const rangeInput = row.querySelector('.spell-range');
        const materialInput = row.querySelector('.spell-material');
        const notesInput = row.querySelector('.spell-notes');
        const removeBtn = row.querySelector('.remove-btn');
        nameInput.addEventListener('input', () => {
            const spellData = this.data.spells.find(s => s.id === spell.id);
            if (spellData)
                spellData.name = nameInput.value;
        });
        levelInput.addEventListener('input', () => {
            const spellData = this.data.spells.find(s => s.id === spell.id);
            if (spellData)
                spellData.level = levelInput.value;
        });
        castingTimeInput.addEventListener('input', () => {
            const spellData = this.data.spells.find(s => s.id === spell.id);
            if (spellData)
                spellData.castingTime = castingTimeInput.value;
        });
        concentrationInput.addEventListener('input', () => {
            const spellData = this.data.spells.find(s => s.id === spell.id);
            if (spellData)
                spellData.concentration = concentrationInput.value;
        });
        rangeInput.addEventListener('input', () => {
            const spellData = this.data.spells.find(s => s.id === spell.id);
            if (spellData)
                spellData.range = rangeInput.value;
        });
        materialInput.addEventListener('input', () => {
            const spellData = this.data.spells.find(s => s.id === spell.id);
            if (spellData)
                spellData.material = materialInput.value;
        });
        notesInput.addEventListener('input', () => {
            const spellData = this.data.spells.find(s => s.id === spell.id);
            if (spellData)
                spellData.notes = notesInput.value;
        });
        removeBtn.addEventListener('click', () => {
            this.removeSpell(spell.id);
        });
        return row;
    }
    addSpell() {
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
    }
    removeSpell(id) {
        this.data.spells = this.data.spells.filter(s => s.id !== id);
        this.renderSpells();
    }
    showSaveStatus(status, message) {
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
}
else {
    new CharacterSheet();
}
//# sourceMappingURL=character-sheet.js.map