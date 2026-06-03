-- Scoring engine: recalculate prediction_scores when match_results change.
-- Apply via Supabase CLI: supabase db push / migration up

-- ---------------------------------------------------------------------------
-- prediction_scores (create if missing)
-- ---------------------------------------------------------------------------

create table if not exists public.prediction_scores (
  prediction_id uuid primary key references public.predictions (id) on delete cascade,
  total_points integer not null default 0,
  exact_score_hit boolean not null default false,
  winner_hit boolean not null default false,
  draw_hit boolean not null default false,
  goal_difference_hit boolean not null default false,
  home_goals_hit boolean not null default false,
  away_goals_hit boolean not null default false,
  calculated_at timestamptz not null default now()
);

create index if not exists idx_predictions_match_id
  on public.predictions (match_id);

-- ---------------------------------------------------------------------------
-- Hit detection
-- ---------------------------------------------------------------------------

create or replace function public.compute_prediction_hits(
  p_pred_home integer,
  p_pred_away integer,
  p_actual_home integer,
  p_actual_away integer
)
returns table (
  exact_score_hit boolean,
  winner_hit boolean,
  draw_hit boolean,
  goal_difference_hit boolean,
  home_goals_hit boolean,
  away_goals_hit boolean
)
language sql
immutable
strict
as $$
  select
    (p_pred_home = p_actual_home and p_pred_away = p_actual_away),
    (
      (p_actual_home > p_actual_away and p_pred_home > p_pred_away)
      or (p_actual_away > p_actual_home and p_pred_away > p_pred_home)
    ),
    (p_actual_home = p_actual_away and p_pred_home = p_pred_away),
    ((p_pred_home - p_pred_away) = (p_actual_home - p_actual_away)),
    (p_pred_home = p_actual_home),
    (p_pred_away = p_actual_away);
$$;

comment on function public.compute_prediction_hits is
  'Derives boolean scoring hits from predicted vs actual match scores.';

-- ---------------------------------------------------------------------------
-- Points from hits + league rules (additive)
-- ---------------------------------------------------------------------------

create or replace function public.calculate_points_from_hits(
  p_exact_score_hit boolean,
  p_winner_hit boolean,
  p_draw_hit boolean,
  p_goal_difference_hit boolean,
  p_home_goals_hit boolean,
  p_away_goals_hit boolean,
  p_exact_score_points integer,
  p_winner_points integer,
  p_draw_points integer,
  p_goal_difference_points integer,
  p_home_goals_points integer,
  p_away_goals_points integer
)
returns integer
language sql
immutable
as $$
  select
    coalesce(case when p_exact_score_hit then p_exact_score_points end, 0)
    + coalesce(case when p_winner_hit then p_winner_points end, 0)
    + coalesce(case when p_draw_hit then p_draw_points end, 0)
    + coalesce(case when p_goal_difference_hit then p_goal_difference_points end, 0)
    + coalesce(case when p_home_goals_hit then p_home_goals_points end, 0)
    + coalesce(case when p_away_goals_hit then p_away_goals_points end, 0);
$$;

comment on function public.calculate_points_from_hits is
  'Sums league_scoring_rules point values for each hit (additive model).';

-- ---------------------------------------------------------------------------
-- Score one prediction
-- ---------------------------------------------------------------------------

create or replace function public.upsert_prediction_score(
  p_prediction_id uuid,
  p_pred_home integer,
  p_pred_away integer,
  p_actual_home integer,
  p_actual_away integer,
  p_league_id uuid,
  p_match_stage text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hits record;
  v_rules record;
  v_total integer;
begin
  select *
  into v_rules
  from public.league_scoring_rules
  where league_id = p_league_id
    and stage = p_match_stage;

  if not found then
    insert into public.prediction_scores (
      prediction_id,
      total_points,
      exact_score_hit,
      winner_hit,
      draw_hit,
      goal_difference_hit,
      home_goals_hit,
      away_goals_hit,
      calculated_at
    )
    values (
      p_prediction_id,
      0,
      false,
      false,
      false,
      false,
      false,
      false,
      now()
    )
    on conflict (prediction_id) do update set
      total_points = excluded.total_points,
      exact_score_hit = excluded.exact_score_hit,
      winner_hit = excluded.winner_hit,
      draw_hit = excluded.draw_hit,
      goal_difference_hit = excluded.goal_difference_hit,
      home_goals_hit = excluded.home_goals_hit,
      away_goals_hit = excluded.away_goals_hit,
      calculated_at = excluded.calculated_at;

    return;
  end if;

  select h.*
  into v_hits
  from public.compute_prediction_hits(
    p_pred_home,
    p_pred_away,
    p_actual_home,
    p_actual_away
  ) as h;

  v_total := public.calculate_points_from_hits(
    v_hits.exact_score_hit,
    v_hits.winner_hit,
    v_hits.draw_hit,
    v_hits.goal_difference_hit,
    v_hits.home_goals_hit,
    v_hits.away_goals_hit,
    v_rules.exact_score_points,
    v_rules.winner_points,
    v_rules.draw_points,
    v_rules.goal_difference_points,
    v_rules.home_goals_points,
    v_rules.away_goals_points
  );

  insert into public.prediction_scores (
    prediction_id,
    total_points,
    exact_score_hit,
    winner_hit,
    draw_hit,
    goal_difference_hit,
    home_goals_hit,
    away_goals_hit,
    calculated_at
  )
  values (
    p_prediction_id,
    v_total,
    v_hits.exact_score_hit,
    v_hits.winner_hit,
    v_hits.draw_hit,
    v_hits.goal_difference_hit,
    v_hits.home_goals_hit,
    v_hits.away_goals_hit,
    now()
  )
  on conflict (prediction_id) do update set
    total_points = excluded.total_points,
    exact_score_hit = excluded.exact_score_hit,
    winner_hit = excluded.winner_hit,
    draw_hit = excluded.draw_hit,
    goal_difference_hit = excluded.goal_difference_hit,
    home_goals_hit = excluded.home_goals_hit,
    away_goals_hit = excluded.away_goals_hit,
    calculated_at = excluded.calculated_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- Recalculate all predictions for a match
-- ---------------------------------------------------------------------------

create or replace function public.recalculate_prediction_scores_for_match(
  p_match_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match record;
  v_result record;
  v_prediction record;
begin
  select m.id, m.stage
  into v_match
  from public.matches m
  where m.id = p_match_id;

  if not found then
    return;
  end if;

  select mr.home_score, mr.away_score
  into v_result
  from public.match_results mr
  where mr.match_id = p_match_id;

  if not found then
    return;
  end if;

  for v_prediction in
    select
      p.id,
      p.league_id,
      p.predicted_home_score,
      p.predicted_away_score
    from public.predictions p
    where p.match_id = p_match_id
      and p.predicted_home_score is not null
      and p.predicted_away_score is not null
  loop
    perform public.upsert_prediction_score(
      v_prediction.id,
      v_prediction.predicted_home_score,
      v_prediction.predicted_away_score,
      v_result.home_score,
      v_result.away_score,
      v_prediction.league_id,
      v_match.stage
    );
  end loop;
end;
$$;

comment on function public.recalculate_prediction_scores_for_match is
  'Loads match + result, scores every prediction for that match, upserts prediction_scores.';

-- ---------------------------------------------------------------------------
-- Trigger on match_results
-- ---------------------------------------------------------------------------

create or replace function public.trg_match_results_recalculate_scores()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
    and old.home_score is not distinct from new.home_score
    and old.away_score is not distinct from new.away_score then
    return new;
  end if;

  perform public.recalculate_prediction_scores_for_match(new.match_id);

  return new;
end;
$$;

drop trigger if exists match_results_recalculate_scores on public.match_results;

create trigger match_results_recalculate_scores
after insert or update of home_score, away_score
on public.match_results
for each row
execute function public.trg_match_results_recalculate_scores();

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant execute on function public.compute_prediction_hits(integer, integer, integer, integer)
  to authenticated, service_role;

grant execute on function public.calculate_points_from_hits(
  boolean, boolean, boolean, boolean, boolean, boolean,
  integer, integer, integer, integer, integer, integer
) to authenticated, service_role;

grant execute on function public.upsert_prediction_score(
  uuid, integer, integer, integer, integer, uuid, text
) to service_role;

grant execute on function public.recalculate_prediction_scores_for_match(uuid)
  to authenticated, service_role;
