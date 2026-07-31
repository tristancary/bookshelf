/**
 * Deterministic mapper from raw metadata subjects/categories to household shelves.
 * Returns the shelves that clearly match. Empty array means "not confident, fall through".
 */

const HOUSEHOLD_SHELVES = [
  'Kids',
  'Fiction',
  'Sci-Fi',
  'Fantasy',
  'Non-Fiction',
  'Reference',
  'Cookbook',
] as const

export type Shelf = (typeof HOUSEHOLD_SHELVES)[number]

const RULES: Array<{ shelf: Shelf; patterns: RegExp[] }> = [
  {
    shelf: 'Kids',
    patterns: [
      /juvenile/i,
      /children/i,
      /picture book/i,
      /board book/i,
      /young reader/i,
      /middle grade/i,
      /early reader/i,
      /(^|\b)ya(\b|$)|young adult/i,
    ],
  },
  {
    shelf: 'Cookbook',
    patterns: [
      /cookbook/i,
      /cooking/i,
      /recipe/i,
      /culinary/i,
      /baking/i,
      /cuisine/i,
    ],
  },
  {
    shelf: 'Sci-Fi',
    patterns: [
      /science fiction/i,
      /sci-fi|scifi/i,
      /space opera/i,
      /cyberpunk/i,
      /dystopia/i,
    ],
  },
  {
    shelf: 'Fantasy',
    patterns: [/fantasy/i, /sword and sorcery/i, /epic fantasy/i, /magical/i],
  },
  {
    shelf: 'Reference',
    patterns: [
      /reference/i,
      /encyclopedia/i,
      /dictionary/i,
      /handbook/i,
      /textbook/i,
      /manual/i,
    ],
  },
  {
    shelf: 'Non-Fiction',
    patterns: [
      /biography/i,
      /autobiography/i,
      /memoir/i,
      /history/i,
      /nonfiction|non-fiction/i,
      /essays/i,
      /philosophy/i,
      /politics/i,
      /economics/i,
      /science(?! fiction)/i,
      /self-help/i,
      /business/i,
    ],
  },
  {
    // Fiction is last so it only matches when nothing more specific did
    shelf: 'Fiction',
    patterns: [/fiction/i, /novel/i, /literature/i, /literary/i, /thriller/i, /mystery/i, /romance/i],
  },
]

export function mapSubjectsToShelves(subjects: string[]): Shelf[] {
  const hits = new Set<Shelf>()
  const joined = subjects.join(' | ')

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(joined)) {
        hits.add(rule.shelf)
        break
      }
    }
  }

  // If we matched a more specific fiction genre, drop generic Fiction
  if (hits.has('Sci-Fi') || hits.has('Fantasy')) hits.delete('Fiction')

  return Array.from(hits)
}

export function isKnownShelf(s: string): s is Shelf {
  return (HOUSEHOLD_SHELVES as readonly string[]).includes(s)
}
