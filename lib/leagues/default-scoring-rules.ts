export const SCORING_STAGES = [
  'group',
  'round_16',
  'round_32',
  'quarterfinal',
  'semifinal',
  'third_place',
  'final',
] as const

export type ScoringStage = (typeof SCORING_STAGES)[number]

type ScoringRuleValues = {
  exact_score_points: number
  winner_points: number
  draw_points: number
  goal_difference_points: number
  home_goals_points: number
  away_goals_points: number
}

export const DEFAULT_SCORING_BY_STAGE: Record<ScoringStage, ScoringRuleValues> = {
  group: {
    exact_score_points: 5,
    winner_points: 3,
    draw_points: 3,
    goal_difference_points: 2,
    home_goals_points: 1,
    away_goals_points: 1,
  },
  round_16: {
    exact_score_points: 6,
    winner_points: 4,
    draw_points: 4,
    goal_difference_points: 2,
    home_goals_points: 1,
    away_goals_points: 1,
  },

  round_32: {
    exact_score_points: 7,
    winner_points: 4,
    draw_points: 4,
    goal_difference_points: 2,
    home_goals_points: 1,
    away_goals_points: 1,
  },
  quarterfinal: {
    exact_score_points: 7,
    winner_points: 4,
    draw_points: 4,
    goal_difference_points: 2,
    home_goals_points: 1,
    away_goals_points: 1,
  },
  semifinal: {
    exact_score_points: 8,
    winner_points: 5,
    draw_points: 5,
    goal_difference_points: 3,
    home_goals_points: 1,
    away_goals_points: 1,
  },
  third_place: {
    exact_score_points: 8,
    winner_points: 5,
    draw_points: 5,
    goal_difference_points: 3,
    home_goals_points: 1,
    away_goals_points: 1,
  },
  final: {
    exact_score_points: 10,
    winner_points: 5,
    draw_points: 5,
    goal_difference_points: 3,
    home_goals_points: 2,
    away_goals_points: 2,
  },
}

export function buildDefaultScoringRules(leagueId: string) {
  return SCORING_STAGES.map((stage) => ({
    league_id: leagueId,
    stage,
    ...DEFAULT_SCORING_BY_STAGE[stage],
  }))
}
