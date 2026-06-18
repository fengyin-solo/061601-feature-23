<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import gameConfig from '../config/gameConfig'
import {
  getAffinityColor,
  getAffinityStage,
  getMoodColor,
  getMoodLabel,
  getCharacterCardsProgress,
  getRarityColor,
  getRarityLabel
} from '../utils/gameUtils'

const gameStore = useGameStore()

const charactersWithConfig = computed(() => {
  return gameStore.unlockedCharacters.map(charState => {
    const config = gameConfig.characters.find(c => c.id === charState.id)
    const cardProgress = getCharacterCardsProgress(
      charState.id,
      gameStore.characters,
      gameStore.collectedCards,
      gameStore.triggeredEvents
    )
    return { state: charState, config, cardProgress }
  }).filter(item => item.config)
})

const selectedCharacterCardsProgress = computed(() => {
  if (!gameStore.selectedCharacterId) return null
  return getCharacterCardsProgress(
    gameStore.selectedCharacterId,
    gameStore.characters,
    gameStore.collectedCards,
    gameStore.triggeredEvents
  )
})

function selectCharacter(id: string) {
  gameStore.selectCharacter(id)
}

function getMissingCardColor(percent: number): string {
  if (percent >= 100) return '#22c55e'
  if (percent >= 70) return '#84cc16'
  if (percent >= 40) return '#eab308'
  return '#94a3b8'
}
</script>

<template>
  <div class="character-panel card">
    <h2 class="panel-title">
      <span class="title-icon">💕</span>
      角色状态
    </h2>

    <div class="character-list">
      <div
        v-for="item in charactersWithConfig"
        :key="item.state.id"
        class="character-card"
        :class="{ selected: gameStore.selectedCharacterId === item.state.id }"
        @click="selectCharacter(item.state.id)"
      >
        <div class="character-avatar">{{ item.config?.avatar }}</div>
        
        <div class="character-info">
          <div class="character-header">
            <span class="character-name">{{ item.config?.name }}</span>
            <span class="affinity-stage">{{ getAffinityStage(item.state.affinity) }}</span>
          </div>
          
          <div class="stat-row">
            <span class="stat-label">好感</span>
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ 
                  width: `${Math.max(0, (item.state.affinity / gameConfig.maxAffinity) * 100)}%`,
                  backgroundColor: getAffinityColor(item.state.affinity, gameConfig.maxAffinity)
                }"
              ></div>
            </div>
            <span class="stat-value">{{ item.state.affinity }}</span>
          </div>
          
          <div class="stat-row">
            <span class="stat-label">心情</span>
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ 
                  width: `${(item.state.mood / gameConfig.maxMood) * 100}%`,
                  backgroundColor: getMoodColor(item.state.mood)
                }"
              ></div>
            </div>
            <span class="stat-value mood" :style="{ color: getMoodColor(item.state.mood) }">
              {{ getMoodLabel(item.state.mood) }}
            </span>
          </div>

          <div class="card-progress-row">
            <span class="stat-label">卡牌</span>
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ 
                  width: `${(item.cardProgress.collected / item.cardProgress.total) * 100}%`,
                  backgroundColor: item.cardProgress.locked === 0 ? '#22c55e' : '#a855f7'
                }"
              ></div>
            </div>
            <span class="stat-value cards-count" :class="{ complete: item.cardProgress.locked === 0 }">
              {{ item.cardProgress.collected }}/{{ item.cardProgress.total }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="gameStore.currentCharacterConfig && selectedCharacterCardsProgress" class="character-detail">
      <div class="detail-divider"></div>
      <p class="detail-description">{{ gameStore.currentCharacterConfig.description }}</p>
      <p class="detail-personality">性格：{{ gameStore.currentCharacterConfig.personality }}</p>

      <div class="cards-gap-section">
        <div class="section-header">
          <h3 class="section-title">🎴 卡牌收集进度</h3>
          <span class="section-badge" :class="{ complete: selectedCharacterCardsProgress.locked === 0 }">
            {{ selectedCharacterCardsProgress.locked === 0 ? '全部收集 ✓' : `还差 ${selectedCharacterCardsProgress.locked} 张` }}
          </span>
        </div>

        <div v-if="selectedCharacterCardsProgress.locked > 0" class="missing-cards-list">
          <div 
            v-for="missing in selectedCharacterCardsProgress.missingCards" 
            :key="missing.card.id"
            class="missing-card-item"
          >
            <div class="missing-card-icon" :style="{ borderColor: getRarityColor(missing.card.rarity) }">🔒</div>
            <div class="missing-card-info">
              <div class="missing-card-header">
                <span class="missing-card-name">???</span>
                <span class="missing-card-rarity badge" :class="`badge-${missing.card.rarity}`">
                  {{ getRarityLabel(missing.card.rarity) }}
                </span>
              </div>
              <div class="missing-card-condition">
                <span class="condition-text">{{ missing.progress.description }}</span>
                <span class="condition-progress" :style="{ color: getMissingCardColor(missing.progressPercent) }">
                  {{ missing.progressText }}
                </span>
              </div>
              <div class="mini-progress-bar">
                <div 
                  class="mini-progress-fill"
                  :style="{ 
                    width: `${missing.progressPercent}%`,
                    background: getMissingCardColor(missing.progressPercent)
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="all-collected">
          <span class="collected-icon">🎉</span>
          <span class="collected-text">恭喜！已收集该角色的全部卡牌</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.character-panel {
  padding: 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 22px;
}

.character-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.character-card {
  display: flex;
  gap: 14px;
  padding: 14px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.character-card:hover {
  transform: translateX(4px);
  background: var(--accent-light);
}

.character-card.selected {
  border-color: var(--accent-primary);
  background: var(--accent-light);
}

.character-avatar {
  width: 56px;
  height: 56px;
  background: var(--bg-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}

.character-info {
  flex: 1;
  min-width: 0;
}

.character-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.character-name {
  font-weight: 600;
  font-size: 15px;
}

.affinity-stage {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--accent-primary);
  color: white;
  border-radius: 9999px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  width: 30px;
  flex-shrink: 0;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-secondary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

.stat-value {
  font-size: 12px;
  font-weight: 500;
  min-width: 30px;
  text-align: right;
}

.stat-value.mood {
  font-size: 11px;
}

.character-detail {
  margin-top: 8px;
}

.detail-divider {
  height: 1px;
  background: var(--border-light);
  margin: 12px 0;
}

.detail-description {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 6px;
}

.detail-personality {
  font-size: 12px;
  color: var(--text-muted);
}

.card-progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed var(--border-light);
}

.cards-count {
  font-size: 12px;
  font-weight: 500;
  min-width: 40px;
  text-align: right;
  color: var(--text-secondary);
}

.cards-count.complete {
  color: #22c55e;
  font-weight: 600;
}

.cards-gap-section {
  margin-top: 16px;
  padding: 14px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
}

.section-badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 9999px;
  background: var(--accent-light);
  color: var(--accent-primary);
  font-weight: 500;
}

.section-badge.complete {
  background: #dcfce7;
  color: #16a34a;
}

.missing-cards-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.missing-card-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  align-items: flex-start;
}

.missing-card-icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  border: 2px solid var(--border-color);
  flex-shrink: 0;
  opacity: 0.7;
}

.missing-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.missing-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.missing-card-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--text-muted);
}

.missing-card-rarity {
  font-size: 10px;
  opacity: 0.8;
}

.missing-card-condition {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.condition-text {
  color: var(--text-secondary);
}

.condition-progress {
  font-weight: 600;
  white-space: nowrap;
  margin-left: 8px;
}

.mini-progress-bar {
  width: 100%;
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.mini-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s, background 0.3s;
}

.all-collected {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: linear-gradient(135deg, #dcfce7 0%, #fef9c3 100%);
  border-radius: var(--radius-sm);
}

.collected-icon {
  font-size: 24px;
}

.collected-text {
  font-size: 13px;
  font-weight: 600;
  color: #16a34a;
}

.badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.badge-common {
  background: #e2e8f0;
  color: #475569;
}

.badge-rare {
  background: #dbeafe;
  color: #2563eb;
}

.badge-epic {
  background: #f3e8ff;
  color: #9333ea;
}

.badge-legendary {
  background: #fef3c7;
  color: #d97706;
}
</style>
