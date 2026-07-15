WITH base_slugs AS (
  SELECT
    "id",
    TRIM(BOTH '-' FROM LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            COALESCE(NULLIF(TRIM("descriptiveTitle"), ''), NULLIF(TRIM("title"), ''), 'product'),
            '[^[:alnum:][:space:]-]',
            '',
            'g'
          ),
          '[[:space:]]+',
          '-',
          'g'
        ),
        '-+',
        '-',
        'g'
      )
    )) AS base_slug
  FROM "Product"
),
ranked AS (
  SELECT
    "id",
    CASE WHEN base_slug = '' THEN 'product' ELSE base_slug END AS normalized_slug,
    ROW_NUMBER() OVER (
      PARTITION BY CASE WHEN base_slug = '' THEN 'product' ELSE base_slug END
      ORDER BY "id"
    ) AS rn
  FROM base_slugs
)
UPDATE "Product" AS p
SET "slug" = CASE
  WHEN ranked.rn = 1 THEN ranked.normalized_slug
  ELSE ranked.normalized_slug || '-' || (ranked.rn - 1)::text
END
FROM ranked
WHERE p."id" = ranked."id";
