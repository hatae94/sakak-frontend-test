export function nthTerm(n: number, term: string = '1'): string {
  if (n === 1) return term;

  const groups = term.split('').reduce((r, num, index) => {
    const groupIndex = Math.max(r.length - 1, 0);
    r[groupIndex] ??= { count: 0, value: num };
    r[groupIndex].count++;

    const isNextPresent = term[index + 1] !== undefined;
    const isOpenNextGroup = term[index + 1] !== num;
    if (isNextPresent && isOpenNextGroup) {
      r.push(null);
    }
    return r;
  }, [] as ({ count: number; value: string } | null)[]) as { count: number; value: string }[];
  
  const newTerm = groups.map(group => `${group.count}${group.value}`).join('');
  return nthTerm(n - 1, newTerm);
}

export function getMiddleTwoDigits(n: number): string {
  const term = nthTerm(n);
  
  const mid = Math.floor(term.length / 2);
  return term.slice(mid - 1, mid + 1);
}
