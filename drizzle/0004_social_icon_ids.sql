UPDATE `profile`
SET `social_links` = (
  SELECT json_group_array(
    json_set(
      json_remove(value, '$.iconUrl', '$.iconUrlDark'),
      '$.iconId',
      CASE
        WHEN json_extract(value, '$.iconUrl') IS NOT NULL AND instr(json_extract(value, '$.iconUrl'), 'mado/social/') > 0
        THEN substr(
          substr(json_extract(value, '$.iconUrl'), instr(json_extract(value, '$.iconUrl'), 'mado/social/') + length('mado/social/')),
          1,
          instr(substr(json_extract(value, '$.iconUrl'), instr(json_extract(value, '$.iconUrl'), 'mado/social/') + length('mado/social/')), '.') - 1
        )
        ELSE NULL
      END,
      '$.iconIdDark',
      CASE
        WHEN json_extract(value, '$.iconUrlDark') IS NOT NULL AND instr(json_extract(value, '$.iconUrlDark'), 'mado/social/') > 0
        THEN substr(
          substr(json_extract(value, '$.iconUrlDark'), instr(json_extract(value, '$.iconUrlDark'), 'mado/social/') + length('mado/social/')),
          1,
          instr(substr(json_extract(value, '$.iconUrlDark'), instr(json_extract(value, '$.iconUrlDark'), 'mado/social/') + length('mado/social/')), '.') - 1
        )
        ELSE NULL
      END
    )
  )
  FROM json_each(`social_links`)
)
WHERE `social_links` IS NOT NULL AND `social_links` != '[]';
