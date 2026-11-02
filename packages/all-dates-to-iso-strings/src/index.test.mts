import { describe, expect, it } from 'vitest';
import {
  convertArrayDatesToStrings,
  convertObjectDatesToStrings,
} from '../src/index.mjs';

describe('convertArrayDatesToStrings', () => {
  it('converts Date elements to ISO strings', () => {
    const date = new Date('01-01-1970');
    expect(convertArrayDatesToStrings([date])).toStrictEqual([
      date.toISOString(),
    ]);
  });

  it('converts Date elements in deeply nested arrays', () => {
    const dateA = new Date('01-01-1970');
    const dateB = new Date('01-01-1980');
    const dateC = new Date('01-01-1990');
    const input = [dateA, [dateB, [dateC]]];

    expect(convertArrayDatesToStrings(input)).toStrictEqual([
      dateA.toISOString(),
      [dateB.toISOString(), [dateC.toISOString()]],
    ]);
  });

  it('converts Date properties in object elements', () => {
    const dateA = new Date('01-01-1970');
    const dateB = new Date('01-01-1980');
    const dateC = new Date('01-01-1990');
    const input = [{ a: dateA }, [{ b: dateB }, [{ c: dateC }]]];

    expect(convertArrayDatesToStrings(input)).toStrictEqual([
      { a: dateA.toISOString() },
      [{ b: dateB.toISOString() }, [{ c: dateC.toISOString() }]],
    ]);
  });
});

describe('convertObjectDatesToStrings', () => {
  it('converts Date properties to ISO strings', () => {
    const date = new Date();
    expect(convertObjectDatesToStrings({ date })).toStrictEqual({
      date: date.toISOString(),
    });
  });

  it('converts Date properties in deeply nested objects', () => {
    const dateA = new Date('01-01-1970');
    const dateB = new Date('01-01-1980');
    const dateC = new Date('01-01-1990');
    const input = {
      a: dateA,
      nestedB: {
        b: dateB,
        nestedC: {
          c: dateC,
        },
      },
    };

    expect(convertObjectDatesToStrings(input)).toStrictEqual({
      a: dateA.toISOString(),
      nestedB: {
        b: dateB.toISOString(),
        nestedC: {
          c: dateC.toISOString(),
        },
      },
    });
  });

  it('converts Date elements inside an array', () => {
    const dateA = new Date('01-01-1970');
    const dateB = new Date('01-01-1980');
    const dateC = new Date('01-01-1990');
    const input = {
      dates: [dateA, dateB, dateC],
    };

    expect(convertObjectDatesToStrings(input)).toStrictEqual({
      dates: [dateA.toISOString(), dateB.toISOString(), dateC.toISOString()],
    });
  });

  it('converts Date elements inside nested arrays', () => {
    const dateA = new Date('01-01-1970');
    const dateB = new Date('01-01-1980');
    const dateC = new Date('01-01-1990');
    const input = {
      dates: [dateA, [dateB, [dateC]]],
    };

    expect(convertObjectDatesToStrings(input)).toStrictEqual({
      dates: [
        dateA.toISOString(),
        [dateB.toISOString(), [dateC.toISOString()]],
      ],
    });
  });
});
