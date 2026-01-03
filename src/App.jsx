import React, { useState, useEffect, useRef } from 'react';
import { Swords, Shield, Anchor, Target, Users, Award, Crown } from 'lucide-react';

const App = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('menu');
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [units, setUnits] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [projectiles, setProjectiles] = useState([]);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [gold, setGold] = useState(500);
  const [dragSelect, setDragSelect] = useState(null);
  const [rank, setRank] = useState(0);
  const [battles, setBattles] = useState(0);
  const [terrain, setTerrain] = useState([]);
  const [showPromotion, setShowPromotion] = useState(false);
  const animationRef = useRef(null);

  const TILE_SIZE = 40;
  const MAP_WIDTH = 20;
  const MAP_HEIGHT = 15;

  const ranks = [
    { name: 'Miles', title: 'Soldier', battles: 0, bonus: 0 },
    { name: 'Centurion', title: 'Commander of 100', battles: 1, bonus: 100 },
    { name: 'Tribune', title: 'Military Tribune', battles: 3, bonus: 200 },
    { name: 'Legatus', title: 'Legion Commander', battles: 5, bonus: 300 },
    { name: 'Praetor', title: 'Governor & General', battles: 8, bonus: 500 },
    { name: 'Consul', title: 'Highest Magistrate', battles: 12, bonus: 800 },
    { name: 'Caesar', title: 'Supreme Commander', battles: 15, bonus: 1500 }
  ];

  const terrainTypes = {
    grass: { color: '#2d5016', moveMod: 1, canShip: false, blocking: false },
    forest: { color: '#1a3d0a', moveMod: 0.7, canShip: false, blocking: false },
    mountain: { color: '#5a4a3a', moveMod: 0, canShip: false, blocking: true },
    water: { color: '#1e4d8b', moveMod: 0, canShip: true, blocking: true },
    shallows: { color: '#2d6ba8', moveMod: 0.5, canShip: true, blocking: false }
  };

  const unitTypes = {
    legion: { name: 'Legion', hp: 100, damage: 15, range: 1, speed: 1.5, cost: 50, color: '#8B0000', terrain: ['grass', 'forest', 'shallows'], isRanged: false },
    knight: { name: 'Knight', hp: 80, damage: 20, range: 1, speed: 2.5, cost: 80, color: '#FFD700', terrain: ['grass', 'forest'], isRanged: false },
    javelin: { name: 'Javelin', hp: 60, damage: 12, range: 4, speed: 1.8, cost: 60, color: '#CD853F', terrain: ['grass', 'forest', 'shallows'], isRanged: true },
    catapult: { name: 'Catapult', hp: 50, damage: 40, range: 7, speed: 0.8, cost: 120, color: '#696969', terrain: ['grass', 'forest'], isRanged: true },
    ship: { name: 'War Ship', hp: 150, damage: 25, range: 5, speed: 1.2, cost: 150, color: '#4169E1', terrain: ['water', 'shallows'], isRanged: true }
  };

  const enemyTypes = {
    attila: { name: 'Attila Warrior', hp: 90, damage: 18, range: 1, speed: 2, color: '#8B4513', gold: 30 },
    persian: { name: 'Persian Soldier', hp: 70, damage: 14, range: 2, speed: 1.7, color: '#9932CC', gold: 25 },
    barbarian: { name: 'Barbarian', hp: 110, damage: 20, range: 1, speed: 1.3, color: '#228B22', gold: 35 }
  };

  const generateTerrain = () => {
    const newTerrain = [];

    // Base grass
    for (let x = 0; x < MAP_WIDTH; x++) {
      newTerrain[x] = [];
      for (let y = 0; y < MAP_HEIGHT; y++) {
        newTerrain[x][y] = 'grass';
      }
    }

    // Add river on left side
    for (let y = 0; y < MAP_HEIGHT; y++) {
      newTerrain[0][y] = 'water';
      newTerrain[1][y] = y % 3 === 0 ? 'shallows' : 'water';
    }

    // Add forest patches
    const forestCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < forestCount; i++) {
      const centerX = 5 + Math.floor(Math.random() * 10);
      const centerY = 2 + Math.floor(Math.random() * 11);
      const size = 2 + Math.floor(Math.random() * 2);

      for (let dx = -size; dx <= size; dx++) {
        for (let dy = -size; dy <= size; dy++) {
          const x = centerX + dx;
          const y = centerY + dy;
          if (x >= 2 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT &&
            Math.abs(dx) + Math.abs(dy) <= size) {
            newTerrain[x][y] = 'forest';
          }
        }
      }
    }

    // Add mountains
    const mountainCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < mountainCount; i++) {
      const x = 8 + Math.floor(Math.random() * 8);
      const y = 2 + Math.floor(Math.random() * 11);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 2 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
            newTerrain[nx][ny] = 'mountain';
          }
        }
      }
    }

    return newTerrain;
  };

  useEffect(() => {
    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [gameState, units, enemies, projectiles]);

  const startGame = () => {
    const newTerrain = generateTerrain();
    setTerrain(newTerrain);

    const initialUnits = [
      { id: 1, type: 'legion', x: 3, y: 7, hp: 100, maxHp: 100, moving: false, moveTarget: null },
      { id: 2, type: 'legion', x: 3, y: 8, hp: 100, maxHp: 100, moving: false, moveTarget: null },
      { id: 3, type: 'knight', x: 4, y: 7, hp: 80, maxHp: 80, moving: false, moveTarget: null },
      { id: 4, type: 'javelin', x: 2, y: 7, hp: 60, maxHp: 60, moving: false, moveTarget: null },
      { id: 5, type: 'javelin', x: 2, y: 8, hp: 60, maxHp: 60, moving: false, moveTarget: null },
      { id: 6, type: 'ship', x: 1, y: 3, hp: 150, maxHp: 150, moving: false, moveTarget: null },
    ];
    setUnits(initialUnits);
    spawnWave(1);
    setScore(0);
    setWave(1);
    setGold(500 + ranks[rank].bonus);
    setSelectedUnits([]);
    setShowPromotion(false);
    setGameState('playing');
  };

  const spawnWave = (waveNum) => {
    const enemyCount = 3 + waveNum * 2;
    const newEnemies = [];
    const types = ['attila', 'persian', 'barbarian'];

    for (let i = 0; i < enemyCount; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const enemyData = enemyTypes[type];

      let x, y;
      do {
        x = MAP_WIDTH - 3 + Math.random() * 2;
        y = Math.random() * (MAP_HEIGHT - 4) + 2;
      } while (terrain[Math.floor(x)] && terrain[Math.floor(x)][Math.floor(y)] === 'mountain');

      newEnemies.push({
        id: Date.now() + i,
        type,
        x, y,
        hp: enemyData.hp,
        maxHp: enemyData.hp,
        moving: false,
        moveTarget: null
      });
    }
    setEnemies(prev => [...prev, ...newEnemies]);
  };

  const canMoveTo = (unit, x, y) => {
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return false;

    const terrainType = terrain[tx]?.[ty];
    if (!terrainType) return false;

    const unitData = unitTypes[unit.type];
    return unitData.terrain.includes(terrainType);
  };

  const screenToIso = (screenX, screenY, canvas) => {
    const offsetX = screenX - canvas.width / 2;
    const offsetY = screenY - 50;

    const x = (offsetX / (TILE_SIZE / 2) + offsetY / (TILE_SIZE / 4)) / 2;
    const y = (offsetY / (TILE_SIZE / 4) - offsetX / (TILE_SIZE / 2)) / 2;

    return { x, y };
  };

  const isoToScreen = (x, y, canvas) => {
    const isoX = (x - y) * TILE_SIZE / 2 + canvas.width / 2;
    const isoY = (x + y) * TILE_SIZE / 4 + 50;
    return { isoX, isoY };
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let clickedUnit = null;
    units.forEach(unit => {
      if (unit.hp <= 0) return;
      const { isoX, isoY } = isoToScreen(unit.x, unit.y, canvas);
      const dist = Math.sqrt((clickX - isoX) ** 2 + (clickY - isoY) ** 2);
      if (dist < 10) {
        clickedUnit = unit;
      }
    });

    if (e.shiftKey && clickedUnit) {
      setSelectedUnits(prev => {
        if (prev.find(u => u.id === clickedUnit.id)) {
          return prev.filter(u => u.id !== clickedUnit.id);
        }
        return [...prev, clickedUnit];
      });
    } else if (clickedUnit) {
      setSelectedUnits([clickedUnit]);
    } else if (selectedUnits.length > 0) {
      const { x, y } = screenToIso(clickX, clickY, canvas);
      if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
        setUnits(prev => prev.map(unit => {
          if (selectedUnits.find(su => su.id === unit.id) && canMoveTo(unit, x, y)) {
            return { ...unit, moving: true, moveTarget: { x, y } };
          }
          return unit;
        }));
      }
    } else {
      setSelectedUnits([]);
    }
  };

  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragSelect({ startX: x, startY: y, endX: x, endY: y });
  };

  const handleCanvasMouseMove = (e) => {
    if (dragSelect) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDragSelect(prev => ({ ...prev, endX: x, endY: y }));
    }
  };

  const handleCanvasMouseUp = (e) => {
    if (dragSelect) {
      const canvas = canvasRef.current;
      const minX = Math.min(dragSelect.startX, dragSelect.endX);
      const maxX = Math.max(dragSelect.startX, dragSelect.endX);
      const minY = Math.min(dragSelect.startY, dragSelect.endY);
      const maxY = Math.max(dragSelect.startY, dragSelect.endY);

      const selected = units.filter(unit => {
        if (unit.hp <= 0) return false;
        const { isoX, isoY } = isoToScreen(unit.x, unit.y, canvas);
        return isoX >= minX && isoX <= maxX && isoY >= minY && isoY <= maxY;
      });

      if (selected.length > 0) {
        setSelectedUnits(selected);
      }
      setDragSelect(null);
    }
  };

  const recruitUnit = (type) => {
    const cost = unitTypes[type].cost;
    if (gold >= cost) {
      let x, y;
      const unitData = unitTypes[type];

      // Spawn in valid terrain
      do {
        if (type === 'ship') {
          x = 0.5 + Math.random();
          y = 2 + Math.random() * 10;
        } else {
          x = 2 + Math.random() * 2;
          y = 6 + Math.random() * 3;
        }
      } while (!terrain[Math.floor(x)]?.[Math.floor(y)] ||
        !unitData.terrain.includes(terrain[Math.floor(x)][Math.floor(y)]));

      const newUnit = {
        id: Date.now(),
        type,
        x, y,
        hp: unitTypes[type].hp,
        maxHp: unitTypes[type].hp,
        moving: false,
        moveTarget: null
      };
      setUnits(prev => [...prev, newUnit]);
      setGold(prev => prev - cost);
    }
  };

  const distance = (x1, y1, x2, y2) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  const gameLoop = () => {
    setUnits(prevUnits => {
      const newUnits = prevUnits.filter(u => u.hp > 0).map(unit => {
        const unitData = unitTypes[unit.type];
        let newUnit = { ...unit };

        if (unit.moving && unit.moveTarget) {
          const dist = distance(unit.x, unit.y, unit.moveTarget.x, unit.moveTarget.y);
          if (dist > 0.3) {
            const dx = unit.moveTarget.x - unit.x;
            const dy = unit.moveTarget.y - unit.y;
            const len = Math.sqrt(dx * dx + dy * dy);

            const newX = unit.x + (dx / len) * unitData.speed * 0.03;
            const newY = unit.y + (dy / len) * unitData.speed * 0.03;

            const tx = Math.floor(newX);
            const ty = Math.floor(newY);
            const terrainType = terrain[tx]?.[ty];
            const moveMod = terrainType ? terrainTypes[terrainType].moveMod : 1;

            if (canMoveTo(unit, newX, newY) && moveMod > 0) {
              newUnit.x = newX;
              newUnit.y = newY;
            } else {
              newUnit.moving = false;
              newUnit.moveTarget = null;
            }
          } else {
            newUnit.moving = false;
            newUnit.moveTarget = null;
          }
        }

        if (!unit.moving || distance(unit.x, unit.y, unit.moveTarget?.x || unit.x, unit.moveTarget?.y || unit.y) < 0.3) {
          let nearestEnemy = null;
          let minDist = Infinity;
          enemies.forEach(enemy => {
            if (enemy.hp > 0) {
              const dist = distance(unit.x, unit.y, enemy.x, enemy.y);
              if (dist < minDist && dist <= unitData.range + 1) {
                minDist = dist;
                nearestEnemy = enemy;
              }
            }
          });

          if (nearestEnemy && minDist <= unitData.range) {
            if (!unit.lastAttack || Date.now() - unit.lastAttack > 1000) {
              if (unitData.isRanged) {
                setProjectiles(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  x: unit.x,
                  y: unit.y,
                  targetX: nearestEnemy.x,
                  targetY: nearestEnemy.y,
                  damage: unitData.damage,
                  enemyId: nearestEnemy.id
                }]);
              } else {
                setEnemies(prev => prev.map(e =>
                  e.id === nearestEnemy.id ? { ...e, hp: e.hp - unitData.damage } : e
                ));
              }
              newUnit.lastAttack = Date.now();
            }
          }
        }

        return newUnit;
      });

      return newUnits;
    });

    setEnemies(prevEnemies => {
      const alive = prevEnemies.filter(e => e.hp > 0);
      const dead = prevEnemies.filter(e => e.hp <= 0 && !e.counted);

      if (dead.length > 0) {
        let goldEarned = 0;
        dead.forEach(e => {
          goldEarned += enemyTypes[e.type].gold;
        });
        setGold(g => g + goldEarned);
        setScore(s => s + dead.length * 10);
      }

      const newEnemies = alive.map(enemy => {
        const enemyData = enemyTypes[enemy.type];
        let newEnemy = { ...enemy };

        let nearestUnit = null;
        let minDist = Infinity;
        units.forEach(unit => {
          if (unit.hp > 0) {
            const dist = distance(enemy.x, enemy.y, unit.x, unit.y);
            if (dist < minDist) {
              minDist = dist;
              nearestUnit = unit;
            }
          }
        });

        if (nearestUnit) {
          const dist = distance(enemy.x, enemy.y, nearestUnit.x, nearestUnit.y);

          if (dist > enemyData.range) {
            const dx = nearestUnit.x - enemy.x;
            const dy = nearestUnit.y - enemy.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const newX = enemy.x + (dx / len) * enemyData.speed * 0.02;
            const newY = enemy.y + (dy / len) * enemyData.speed * 0.02;

            const tx = Math.floor(newX);
            const ty = Math.floor(newY);
            if (terrain[tx]?.[ty] !== 'mountain' && terrain[tx]?.[ty] !== 'water') {
              newEnemy.x = newX;
              newEnemy.y = newY;
            }
          } else {
            if (!enemy.lastAttack || Date.now() - enemy.lastAttack > 1200) {
              setUnits(prev => prev.map(u =>
                u.id === nearestUnit.id ? { ...u, hp: u.hp - enemyData.damage } : u
              ));
              newEnemy.lastAttack = Date.now();
            }
          }
        }

        return newEnemy;
      });

      if (newEnemies.length === 0 && alive.length === 0 && prevEnemies.length > 0) {
        setBattles(b => b + 1);
        const newBattles = battles + 1;

        // Check for promotion
        const nextRank = ranks.find((r, i) => i > rank && r.battles <= newBattles);
        if (nextRank) {
          const nextRankIndex = ranks.findIndex(r => r.name === nextRank.name);
          setRank(nextRankIndex);
          setShowPromotion(true);
          setTimeout(() => setShowPromotion(false), 4000);
        }

        setWave(w => w + 1);
        setTimeout(() => spawnWave(wave + 1), 3000);
      }

      return newEnemies;
    });

    setProjectiles(prev => {
      const newProjectiles = [];
      prev.forEach(proj => {
        const dx = proj.targetX - proj.x;
        const dy = proj.targetY - proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.5) {
          newProjectiles.push({
            ...proj,
            x: proj.x + (dx / dist) * 0.3,
            y: proj.y + (dy / dist) * 0.3
          });
        } else {
          setEnemies(e => e.map(en =>
            en.id === proj.enemyId ? { ...en, hp: en.hp - proj.damage } : en
          ));
        }
      });
      return newProjectiles;
    });

    if (units.filter(u => u.hp > 0).length === 0 && enemies.length > 0) {
      setGameState('gameover');
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== 'playing') return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw terrain
    for (let x = 0; x < MAP_WIDTH; x++) {
      for (let y = 0; y < MAP_HEIGHT; y++) {
        const terrainType = terrain[x]?.[y] || 'grass';
        const { isoX, isoY } = isoToScreen(x, y, canvas);

        ctx.fillStyle = terrainTypes[terrainType].color;
        ctx.beginPath();
        ctx.moveTo(isoX, isoY);
        ctx.lineTo(isoX + TILE_SIZE / 2, isoY + TILE_SIZE / 4);
        ctx.lineTo(isoX, isoY + TILE_SIZE / 2);
        ctx.lineTo(isoX - TILE_SIZE / 2, isoY + TILE_SIZE / 4);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Draw terrain symbols
        if (terrainType === 'forest') {
          ctx.fillStyle = '#0d1f05';
          ctx.beginPath();
          ctx.arc(isoX, isoY + 5, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (terrainType === 'mountain') {
          ctx.fillStyle = '#3a2a1a';
          ctx.beginPath();
          ctx.moveTo(isoX, isoY - 5);
          ctx.lineTo(isoX - 5, isoY + 5);
          ctx.lineTo(isoX + 5, isoY + 5);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // Draw units
    units.forEach(unit => {
      if (unit.hp <= 0) return;
      const unitData = unitTypes[unit.type];
      const { isoX, isoY } = isoToScreen(unit.x, unit.y, canvas);

      const isSelected = selectedUnits.find(u => u.id === unit.id);

      ctx.fillStyle = unitData.color;
      ctx.beginPath();
      ctx.arc(isoX, isoY, 8, 0, Math.PI * 2);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.stroke();

      const hpPercent = unit.hp / unit.maxHp;
      ctx.fillStyle = '#000';
      ctx.fillRect(isoX - 15, isoY - 20, 30, 4);
      ctx.fillStyle = hpPercent > 0.5 ? '#0f0' : hpPercent > 0.25 ? '#ff0' : '#f00';
      ctx.fillRect(isoX - 15, isoY - 20, 30 * hpPercent, 4);

      if (unit.moveTarget) {
        const { isoX: targetX, isoY: targetY } = isoToScreen(unit.moveTarget.x, unit.moveTarget.y, canvas);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(isoX, isoY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Draw enemies
    enemies.forEach(enemy => {
      if (enemy.hp <= 0) return;
      const { isoX, isoY } = isoToScreen(enemy.x, enemy.y, canvas);

      ctx.fillStyle = enemyTypes[enemy.type].color;
      ctx.beginPath();
      ctx.arc(isoX, isoY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();

      const hpPercent = enemy.hp / enemy.maxHp;
      ctx.fillStyle = '#000';
      ctx.fillRect(isoX - 15, isoY - 20, 30, 4);
      ctx.fillStyle = hpPercent > 0.5 ? '#0f0' : hpPercent > 0.25 ? '#ff0' : '#f00';
      ctx.fillRect(isoX - 15, isoY - 20, 30 * hpPercent, 4);
    });

    // Draw projectiles
    projectiles.forEach(proj => {
      const { isoX, isoY } = isoToScreen(proj.x, proj.y, canvas);
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(isoX, isoY, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    if (dragSelect) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        dragSelect.startX,
        dragSelect.startY,
        dragSelect.endX - dragSelect.startX,
        dragSelect.endY - dragSelect.startY
      );
      ctx.setLineDash([]);
    }
  }, [units, enemies, projectiles, selectedUnits, dragSelect, terrain, gameState]);

  const currentRank = ranks[rank];
  const nextRank = ranks[rank + 1];

  return (
    <div className="w-full h-screen bg-gradient-to-br from-stone-900 via-red-950 to-stone-900 flex flex-col items-center justify-center p-4">
      {gameState === 'menu' && (
        <div className="max-w-4xl w-full bg-stone-900/80 backdrop-blur-md border-y-4 border-yellow-600/50 p-12 rounded-lg shadow-2xl text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(185,28,28,0.1),transparent)] pointer-events-none" />

          <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 mb-2 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]" style={{ fontFamily: 'serif' }}>
            CAESAR III
          </h1>
          <h2 className="text-4xl text-yellow-300/80 font-light tracking-[0.3em] mb-12 uppercase">Battle Commander</h2>

          <div className="mb-12 flex flex-col items-center">
            <div className="bg-red-900/40 p-6 rounded-full border border-yellow-600/30 mb-4 animate-pulse">
              <div className="flex items-center justify-center gap-3">
                <Award className="text-yellow-500" size={40} />
                <span className="text-4xl font-serif text-yellow-100">{currentRank.name}</span>
              </div>
            </div>
            <p className="text-xl text-yellow-400/70 italic tracking-widest">{currentRank.title}</p>
            <div className="flex gap-8 mt-6 text-yellow-200/50 uppercase text-xs tracking-tighter">
              <p>Battles Won: <span className="text-yellow-400 font-bold">{battles}</span></p>
              {nextRank && (
                <p>Next Rank: <span className="text-yellow-400 font-bold">{nextRank.battles - battles}</span> To Go</p>
              )}
            </div>
          </div>

          <button
            onClick={startGame}
            className="relative group bg-gradient-to-b from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-yellow-100 font-serif font-black py-6 px-16 text-2xl border-x-4 border-yellow-500 shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all transform hover:scale-105 active:scale-95 hover:shadow-yellow-500/20"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-yellow-400/30" />
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/30" />
            COMMAND YOUR ARMY
          </button>

          <div className="mt-16 text-yellow-200/60 text-left max-w-2xl mx-auto grid grid-cols-2 gap-12 border-t border-yellow-600/20 pt-8">
            <div className="space-y-3">
              <h3 className="text-yellow-500 font-bold tracking-widest uppercase text-sm mb-4">Command Controls</h3>
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-yellow-600 rounded-full" /> Click to select units</div>
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-yellow-600 rounded-full" /> Right-click ground to move</div>
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-yellow-600 rounded-full" /> Drag box to mass select</div>
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-yellow-600 rounded-full" /> SHIFT+Click for multi-select</div>
            </div>
            <div className="space-y-3">
              <h3 className="text-yellow-500 font-bold tracking-widest uppercase text-sm mb-4">Strategic Intelligence</h3>
              <p className="flex items-center gap-2 text-blue-300/80">🌊 Water — Fleet Operations Only</p>
              <p className="flex items-center gap-2 text-green-400/80">🌲 Forest — March Rate Reduced</p>
              <p className="flex items-center gap-2 text-stone-400/80">⛰️ Mountain — Impassable Peaks</p>
              <p className="flex items-center gap-2 text-cyan-200/80">💧 Shallows — Infantry Deployment</p>
            </div>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="flex flex-col items-center w-full max-w-6xl">
          {showPromotion && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-yellow-900 border-4 border-yellow-500 p-8 text-center animate-pulse">
              <Crown className="mx-auto mb-4 text-yellow-400" size={48} />
              <h2 className="text-4xl font-bold text-yellow-300 mb-2">PROMOTED!</h2>
              <p className="text-2xl text-yellow-200">{currentRank.name}</p>
              <p className="text-xl text-yellow-300 italic">{currentRank.title}</p>
              <p className="mt-4 text-yellow-400">+{currentRank.bonus} Gold Bonus!</p>
            </div>
          )}

          <div className="mb-2 flex gap-6 text-yellow-300 text-lg font-bold items-center">
            <div className="flex items-center gap-1">
              <Award size={20} />
              {currentRank.name}
            </div>
            <div>Wave: {wave}</div>
            <div>Score: {score}</div>
            <div className="text-yellow-500">Gold: {gold}</div>
            <div>Units: {units.filter(u => u.hp > 0).length}</div>
            <div>Enemies: {enemies.filter(e => e.hp > 0).length}</div>
          </div>

          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border-4 border-yellow-600 cursor-pointer"
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          />

          <div className="mt-8 flex gap-4 p-4 bg-stone-900/60 rounded-xl border border-yellow-600/20">
            <button
              onClick={() => recruitUnit('legion')}
              className="group relative bg-red-800 hover:bg-red-700 text-yellow-100 font-bold py-3 px-6 rounded-lg border-b-4 border-red-950 flex flex-col items-center gap-1 transition-all hover:-translate-y-1 active:border-b-0 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              disabled={gold < 50}
            >
              <div className="flex items-center gap-2">
                <Shield size={20} className="group-hover:rotate-12 transition-transform" />
                <span>Legion</span>
              </div>
              <span className="text-xs text-yellow-500/80 font-mono">50 Gold</span>
            </button>
            <button
              onClick={() => recruitUnit('knight')}
              className="group relative bg-yellow-700 hover:bg-yellow-600 text-yellow-100 font-bold py-3 px-6 rounded-lg border-b-4 border-yellow-900 flex flex-col items-center gap-1 transition-all hover:-translate-y-1 active:border-b-0 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              disabled={gold < 80}
            >
              <div className="flex items-center gap-2">
                <Users size={20} className="group-hover:scale-110 transition-transform" />
                <span>Knight</span>
              </div>
              <span className="text-xs text-yellow-100/50 font-mono">80 Gold</span>
            </button>
            <button
              onClick={() => recruitUnit('javelin')}
              className="group relative bg-orange-800 hover:bg-orange-700 text-yellow-100 font-bold py-3 px-6 rounded-lg border-b-4 border-orange-950 flex flex-col items-center gap-1 transition-all hover:-translate-y-1 active:border-b-0 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              disabled={gold < 60}
            >
              <div className="flex items-center gap-2">
                <Target size={20} className="group-hover:scale-125 transition-transform" />
                <span>Javelin</span>
              </div>
              <span className="text-xs text-orange-200/50 font-mono">60 Gold</span>
            </button>
            <button
              onClick={() => recruitUnit('catapult')}
              className="group relative bg-stone-700 hover:bg-stone-600 text-yellow-100 font-bold py-3 px-6 rounded-lg border-b-4 border-stone-900 flex flex-col items-center gap-1 transition-all hover:-translate-y-1 active:border-b-0 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              disabled={gold < 120}
            >
              <div className="flex items-center gap-2">
                <Swords size={20} className="group-hover:-rotate-12 transition-transform" />
                <span>Catapult</span>
              </div>
              <span className="text-xs text-stone-100/50 font-mono">120 Gold</span>
            </button>
            <button
              onClick={() => recruitUnit('ship')}
              className="group relative bg-blue-800 hover:bg-blue-700 text-yellow-100 font-bold py-3 px-6 rounded-lg border-b-4 border-blue-950 flex flex-col items-center gap-1 transition-all hover:-translate-y-1 active:border-b-0 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              disabled={gold < 150}
            >
              <div className="flex items-center gap-2">
                <Anchor size={20} className="group-hover:translate-x-1 transition-transform" />
                <span>War Ship</span>
              </div>
              <span className="text-xs text-blue-100/50 font-mono">150 Gold</span>
            </button>
          </div>

          <div className="mt-2 text-yellow-300 text-sm text-center">
            {selectedUnits.length > 0 ? (
              <span>Selected: {selectedUnits.length} unit(s) - Click terrain to move (units respect terrain limits)</span>
            ) : (
              <span>Ships stay in water • Infantry avoids mountains • Forest slows movement</span>
            )}
          </div>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="text-center">
          <h2 className="text-5xl font-bold text-red-600 mb-8">DEFEAT</h2>
          <p className="text-2xl text-yellow-300 mb-2">Final Rank: {currentRank.name}</p>
          <p className="text-xl text-yellow-300 mb-2">Final Score: {score}</p>
          <p className="text-xl text-yellow-300 mb-8">Total Battles Won: {battles}</p>
          <button
            onClick={startGame}
            className="bg-red-800 hover:bg-red-700 text-yellow-200 font-bold py-4 px-8 text-xl border-4 border-yellow-600"
            style={{ fontFamily: 'serif' }}
          >
            FIGHT AGAIN
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
