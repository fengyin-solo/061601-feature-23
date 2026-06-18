import type { TimeOfDay, MoodLevel, GameConfig, CharacterConfig, CardConfig } from '../types/game'
import gameConfig from '../config/gameConfig'
import type { CharacterState } from '../stores/gameStore'

export function getMoodLevel(mood: number): MoodLevel {
  if (mood >= 80) return 'happy'
  if (mood >= 60) return 'good'
  if (mood >= 40) return 'neutral'
  if (mood >= 20) return 'bad'
  return 'angry'
}

export function getMoodColor(mood: number): string {
  const level = getMoodLevel(mood)
  const colors: Record<MoodLevel, string> = {
    happy: '#22c55e',
    good: '#84cc16',
    neutral: '#eab308',
    bad: '#f97316',
    angry: '#ef4444'
  }
  return colors[level]
}

export function getMoodLabel(mood: number): string {
  const level = getMoodLevel(mood)
  const labels: Record<MoodLevel, string> = {
    happy: '开心',
    good: '不错',
    neutral: '一般',
    bad: '低落',
    angry: '生气'
  }
  return labels[level]
}

export function getTimeLabel(time: TimeOfDay): string {
  const labels: Record<TimeOfDay, string> = {
    morning: '早晨',
    afternoon: '下午',
    evening: '傍晚',
    night: '深夜'
  }
  return labels[time]
}

export function getTimeIcon(time: TimeOfDay): string {
  const icons: Record<TimeOfDay, string> = {
    morning: '🌅',
    afternoon: '☀️',
    evening: '🌆',
    night: '🌙'
  }
  return icons[time]
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function getAffinityColor(affinity: number, maxAffinity: number): string {
  const ratio = affinity / maxAffinity
  if (ratio >= 0.8) return '#ec4899'
  if (ratio >= 0.6) return '#f472b6'
  if (ratio >= 0.4) return '#fb923c'
  if (ratio >= 0.2) return '#fbbf24'
  if (ratio >= 0) return '#94a3b8'
  return '#64748b'
}

export function getAffinityStage(affinity: number): string {
  if (affinity >= 80) return '恋人'
  if (affinity >= 60) return '亲密'
  if (affinity >= 40) return '好友'
  if (affinity >= 20) return '朋友'
  if (affinity >= 0) return '相识'
  return '陌生'
}

export function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: '#94a3b8',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b'
  }
  return colors[rarity] || '#94a3b8'
}

export function getRarityLabel(rarity: string): string {
  const labels: Record<string, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return labels[rarity] || '普通'
}

export function getNextTimeSlot(current: TimeOfDay, timeSlots: TimeOfDay[]): TimeOfDay {
  const index = timeSlots.indexOf(current)
  if (index < timeSlots.length - 1) {
    return timeSlots[index + 1]
  }
  return timeSlots[0]
}

export function isGiftLiked(giftId: string, character: CharacterConfig): boolean {
  return character.favoriteGifts.includes(giftId)
}

export function isGiftDisliked(giftId: string, character: CharacterConfig): boolean {
  return character.dislikedGifts.includes(giftId)
}

export function calculateChatAffinity(
  topic: string,
  character: CharacterConfig,
  mood: number,
  timeOfDay: TimeOfDay
): number {
  const topicConfig = character.chatTopics.find(t => t.topic === topic)
  let baseChange = topicConfig ? topicConfig.affinity : 0

  const moodMultiplier = 0.5 + (mood / 100)
  baseChange *= moodMultiplier

  if (timeOfDay === 'night' && character.baseMood < 50) {
    baseChange *= 0.7
  }
  if (timeOfDay === 'morning' && character.baseMood >= 60) {
    baseChange *= 1.2
  }

  return Math.round(baseChange * 10) / 10
}

export function calculateGiftAffinity(
  giftId: string,
  character: CharacterConfig,
  giftPrice: number,
  mood: number
): number {
  let baseChange = giftPrice / 10

  if (isGiftLiked(giftId, character)) {
    baseChange *= 2
  } else if (isGiftDisliked(giftId, character)) {
    baseChange *= -0.5
  }

  const moodMultiplier = 0.6 + (mood / 150)
  baseChange *= moodMultiplier

  return Math.round(baseChange * 10) / 10
}

export type CardUnlockType = 'affinity' | 'meet' | 'event' | 'unknown'

export interface CardUnlockProgress {
  type: CardUnlockType
  current: number
  target: number
  description: string
  characterId?: string
}

export function parseCardUnlockCondition(card: CardConfig): CardUnlockProgress {
  const condition = card.unlockCondition

  const affinityMatch = condition.match(/^(\w+)_affinity_(\d+)$/)
  if (affinityMatch) {
    const characterId = affinityMatch[1]
    const targetAffinity = parseInt(affinityMatch[2], 10)
    const character = gameConfig.characters.find(c => c.id === characterId)
    return {
      type: 'affinity',
      current: 0,
      target: targetAffinity,
      description: `好感度达到 ${targetAffinity}`,
      characterId
    }
  }

  const meetMatch = condition.match(/^meet_(\w+)$/)
  if (meetMatch) {
    const characterId = meetMatch[1]
    const character = gameConfig.characters.find(c => c.id === characterId)
    return {
      type: 'meet',
      current: 0,
      target: 1,
      description: `初次见面${character ? ' - ' + character.name : ''}`,
      characterId
    }
  }

  return {
    type: 'unknown',
    current: 0,
    target: 1,
    description: '特殊条件解锁',
    characterId: card.characterId
  }
}

export function getCardUnlockProgress(
  card: CardConfig,
  characters: CharacterState[],
  collectedCards: string[],
  triggeredEvents: string[]
): CardUnlockProgress {
  const base = parseCardUnlockCondition(card)

  if (collectedCards.includes(card.id)) {
    base.current = base.target
    return base
  }

  if (base.type === 'affinity' && base.characterId) {
    const charState = characters.find(c => c.id === base.characterId)
    if (charState) {
      base.current = Math.min(charState.affinity, base.target)
    }
  } else if (base.type === 'meet' && base.characterId) {
    const charId = base.characterId
    
    const hasCharacterIntroEvent = triggeredEvents.some(e => e === `intro_${charId}`)
    
    const sameRoleCommonCard = gameConfig.cards.find(
      c => c.characterId === charId && c.rarity === 'common'
    )
    const hasCommonCard = sameRoleCommonCard && collectedCards.includes(sameRoleCommonCard.id)
    
    if (hasCharacterIntroEvent || hasCommonCard) {
      base.current = 1
    }
  }

  return base
}

export function getCardProgressText(progress: CardUnlockProgress): string {
  if (progress.current >= progress.target) {
    return '已达成 ✓'
  }

  if (progress.type === 'affinity') {
    return `${progress.current} / ${progress.target}`
  }

  if (progress.type === 'meet') {
    return progress.current === 0 ? '未达成' : '已达成 ✓'
  }

  return '未知'
}

export function getCardProgressPercent(progress: CardUnlockProgress): number {
  if (progress.target === 0) return 100
  return Math.min(100, (progress.current / progress.target) * 100)
}

export function getCharacterCardsProgress(
  characterId: string,
  characters: CharacterState[],
  collectedCards: string[],
  triggeredEvents: string[]
): {
  total: number
  collected: number
  locked: number
  missingCards: Array<{
    card: CardConfig
    progress: CardUnlockProgress
    progressPercent: number
    progressText: string
  }>
} {
  const charCards = gameConfig.cards.filter(c => c.characterId === characterId)
  const collected = charCards.filter(c => collectedCards.includes(c.id)).length
  const locked = charCards.length - collected

  const missingCards = charCards
    .filter(c => !collectedCards.includes(c.id))
    .map(card => {
      const progress = getCardUnlockProgress(card, characters, collectedCards, triggeredEvents)
      return {
        card,
        progress,
        progressPercent: getCardProgressPercent(progress),
        progressText: getCardProgressText(progress)
      }
    })
    .sort((a, b) => a.progressPercent - b.progressPercent)

  return {
    total: charCards.length,
    collected,
    locked,
    missingCards
  }
}
