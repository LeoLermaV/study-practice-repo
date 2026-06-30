import type { TopicMeta } from '../../src/lib/content/types'
import type { SourceAdapter } from './base'

interface LeetCodeHint {
  slug: string
  title: string
  difficulty: 'beginner'
  readingTime: number
  tags: string[]
  related: string[]
  body: string
}

const topics: LeetCodeHint[] = [
  {
    slug: 'leetcode-hint-258',
    title: '258. Add Digits',
    difficulty: 'beginner',
    readingTime: 3,
    tags: ['leetcode', 'easy', 'math', 'digits', 'loop'],
    related: ['python-practice-easy-digit-manipulation'],
    body: `## Problem

Given an integer \`num\`, repeatedly add all its digits until the result has only one digit.

### Syntax Heads-up

    # Extract digits
    while n > 0:
        digit = n % 10     # last digit
        n //= 10           # remove last digit

    # Sum digits
    total = 0
    while n > 0:
        total += n % 10
        n //= 10

### Before You Solve

1. Keep summing digits until \`n < 10\` (single digit). Use a \`while n >= 10:\` outer loop.
2. Inner loop extracts and sums all digits.
3. **Math trick (digital root):** if \`n % 9 == 0\` and \`n != 0\`, answer is 9. Otherwise \`n % 9\`.
`,
  },
  {
    slug: 'leetcode-hint-387',
    title: '387. First Unique Character in a String',
    difficulty: 'beginner',
    readingTime: 3,
    tags: ['leetcode', 'easy', 'string', 'hash-map', 'counter'],
    related: ['python-practice-easy-dictionaries-and-counting'],
    body: `## Problem

Given a string \`s\`, find the first non-repeating character and return its index. If it doesn't exist, return -1.

### Syntax Heads-up

    from collections import Counter
    counts = Counter(s)

    # enumerate gives you (index, value) pairs
    for i, char in enumerate(s):
        if counts[char] == 1:
            return i

### Before You Solve

1. First pass: count character frequencies (use \`Counter\` or dictionary).
2. Second pass: iterate through the string with \`enumerate\`, return the first index where count is 1.
3. If loop completes, return -1.
`,
  },
  {
    slug: 'leetcode-hint-2974',
    title: '2974. Minimum Number Game',
    difficulty: 'beginner',
    readingTime: 3,
    tags: ['leetcode', 'easy', 'array', 'sorting', 'simulation'],
    related: ['python-practice-easy-sorting-and-builtins'],
    body: `## Problem

You and Bob take turns removing the smallest numbers from an array. Each round you remove the smallest (Alice), then Bob removes the next smallest. Bob's number goes first in the result, then Alice's. Return the result array.

### Syntax Heads-up

    arr.sort()           # sort in-place
    result = []
    for i in range(0, len(arr), 2):
        result.append(arr[i + 1])  # Bob's (next smallest)
        result.append(arr[i])      # Alice's (smallest)

### Before You Solve

1. Sort the array first.
2. In each round (processing 2 elements), Bob goes first in the result, then Alice.
3. Use \`for i in range(0, len(arr), 2)\` to step by pairs.
4. Edge case: array length is always even per problem constraints, so \`i+1\` is safe.
`,
  },
  {
    slug: 'leetcode-hint-1832',
    title: '1832. Check if the Sentence Is Pangram',
    difficulty: 'beginner',
    readingTime: 3,
    tags: ['leetcode', 'easy', 'string', 'set'],
    related: ['python-practice-easy-sets-and-predicates'],
    body: `## Problem

A pangram is a sentence containing every letter of the alphabet at least once. Return True if the sentence is a pangram.

### Syntax Heads-up

    set(sentence)              # unique characters
    set(sentence.lower())      # case-insensitive
    len(set) == 26             # 26 letters in alphabet

### Before You Solve

1. Convert to lowercase with \`.lower()\`.
2. Build a \`set\` of characters — this gives you unique letters.
3. Check if the set size equals 26 (a-z). That's it.
`,
  },
  {
    slug: 'leetcode-hint-2114',
    title: '2114. Maximum Number of Words Found in Sentences',
    difficulty: 'beginner',
    readingTime: 2,
    tags: ['leetcode', 'easy', 'string', 'list'],
    related: ['python-practice-easy-lists-and-comprehensions', 'python-practice-easy-string-operations'],
    body: `## Problem

Given an array of sentences, return the maximum number of words that appear in a single sentence.

### Syntax Heads-up

    # Count words by counting spaces
    s.count(' ') + 1           # word count

    # Or use max with key
    max(s.split() for s in sentences)

### Before You Solve

1. For each sentence, count the spaces and add 1 (word count = spaces + 1).
2. Use \`row.count(' ')\` or \`len(row.split())\`.
3. Track the maximum with a variable or use \`max()\`.
`,
  },
  {
    slug: 'leetcode-hint-2520',
    title: '2520. Count the Digits That Divide a Number',
    difficulty: 'beginner',
    readingTime: 3,
    tags: ['leetcode', 'easy', 'math', 'digits'],
    related: ['python-practice-easy-digit-manipulation'],
    body: `## Problem

Given an integer, count how many of its digits divide the number evenly (no remainder).

### Syntax Heads-up

    # Convert to string for digit access
    digits = [int(c) for c in str(num)]

    # Or extract with arithmetic
    while n > 0:
        digit = n % 10
        n //= 10

    # Check divisibility
    num % digit == 0

### Before You Solve

1. Extract each digit. If using string approach, \`int('5')\` converts char to int.
2. For each digit, check \`num % digit == 0\`. Count matches.
3. Skip digit 0 (division by zero).
`,
  },
  {
    slug: 'leetcode-hint-2108',
    title: '2108. Find First Palindromic String in the Array',
    difficulty: 'beginner',
    readingTime: 3,
    tags: ['leetcode', 'easy', 'string', 'palindrome'],
    related: ['python-practice-easy-string-operations'],
    body: `## Problem

Given an array of strings, find the first palindromic string (reads the same forwards and backwards). Return it, or empty string if none found.

### Syntax Heads-up

    s == s[::-1]               # palindrome check (reverse string)

### Before You Solve

1. Iterate through the array.
2. For each string, check \`s == s[::-1]\`.
3. Return the first match. Return \`""\` if no palindrome found.
`,
  },
  {
    slug: 'leetcode-hint-2798',
    title: '2798. Number of Employees Who Met the Target',
    difficulty: 'beginner',
    readingTime: 2,
    tags: ['leetcode', 'easy', 'array', 'loop', 'counting'],
    related: ['python-practice-easy-loops-and-conditions'],
    body: `## Problem

Given an array of hours worked and a target, return how many employees worked at least the target number of hours.

### Syntax Heads-up

    count = sum(1 for h in hours if h >= target)
    # or
    count = len([h for h in hours if h >= target])

### Before You Solve

1. Iterate through the \`hours\` array.
2. Count elements where \`h >= target\`.
3. Use a loop + counter, list comprehension, or \`sum()\` with generator.
`,
  },
  {
    slug: 'leetcode-hint-2535',
    title: '2535. Difference Between Element Sum and Digit Sum of an Array',
    difficulty: 'beginner',
    readingTime: 3,
    tags: ['leetcode', 'easy', 'math', 'digits', 'array'],
    related: ['python-practice-easy-digit-manipulation'],
    body: `## Problem

Given an array of integers, return the absolute difference between the sum of the elements and the sum of all their digits.

### Syntax Heads-up

    # Element sum
    element_sum = sum(nums)

    # Digit sum — convert each number to string, iterate chars
    digit_sum = sum(int(c) for num in nums for c in str(num))

    # Absolute difference
    abs(element_sum - digit_sum)

### Before You Solve

1. Element sum is straightforward: \`sum(nums)\`.
2. For digit sum, convert each number to string, iterate its characters, convert each char back to int and sum.
3. Return \`abs(element_sum - digit_sum)\`.
`,
  },
  {
    slug: 'leetcode-hint-2652',
    title: '2652. Sum Multiples',
    difficulty: 'beginner',
    readingTime: 3,
    tags: ['leetcode', 'easy', 'math', 'loop'],
    related: ['python-practice-easy-loops-and-conditions'],
    body: `## Problem

Given a positive integer \`n\`, find the sum of all numbers from 1 to n that are divisible by 3, 5, or 7.

### Syntax Heads-up

    total = sum(i for i in range(1, n + 1) if i % 3 == 0 or i % 5 == 0 or i % 7 == 0)

### Before You Solve

1. Loop through numbers 1 through n inclusive.
2. Check if each number is divisible by 3, 5, or 7 using \`%\`.
3. Sum the qualifying numbers. List comprehension or loop.
`,
  },
  {
    slug: 'leetcode-hint-1486',
    title: '1486. XOR Operation in an Array',
    difficulty: 'beginner',
    readingTime: 3,
    tags: ['leetcode', 'easy', 'bitwise', 'xor'],
    related: ['python-practice-easy-bitwise-and-math'],
    body: `## Problem

Given \`n\` and \`start\`, build an array where \`nums[i] = start + 2 * i\`. Return the XOR of all elements.

### Syntax Heads-up

    # Build array
    nums = [start + 2 * i for i in range(n)]

    # XOR all elements
    result = 0
    for num in nums:
        result ^= num
    # Or use reduce
    from functools import reduce
    import operator
    reduce(operator.xor, nums)

### Before You Solve

1. Build the array: each element is \`start + 2 * i\` for \`i in range(n)\`.
2. XOR all elements. \`x ^ x = 0\` and \`x ^ 0 = x\`.
3. A \`for\` loop with \`result ^= num\` is the clearest approach.
`,
  },
  {
    slug: 'leetcode-hint-2894',
    title: '2894. Divisible and Non-divisible Sums Difference',
    difficulty: 'beginner',
    readingTime: 3,
    tags: ['leetcode', 'easy', 'math', 'loop'],
    related: ['python-practice-easy-loops-and-conditions'],
    body: `## Problem

Given n and m, find the difference between the sum of non-divisible numbers and the sum of divisible numbers from 1 to n.

### Syntax Heads-up

    num1 = sum(i for i in range(1, n + 1) if i % m != 0)   # non-divisible
    num2 = sum(i for i in range(1, n + 1) if i % m == 0)   # divisible

### Before You Solve

1. Loop 1 to n. Track two sums: divisible and non-divisible.
2. \`i % m == 0\` means divisible by m.
3. Return \`num1 - num2\` (non-divisible minus divisible).
`,
  },
  {
    slug: 'leetcode-hint-709',
    title: '709. To Lower Case',
    difficulty: 'beginner',
    readingTime: 2,
    tags: ['leetcode', 'easy', 'string'],
    related: ['python-practice-easy-string-operations'],
    body: `## Problem

Implement a function that converts a string to lowercase.

### Syntax Heads-up

    s.lower()                   # Python built-in (one-liner)

    # Manual approach with ASCII
    ord('A')                    # 65
    ord('Z')                    # 90
    chr(ord('A') + 32)          # 'a'
    chr(ord(c) + 32)            # lowercase a character

### Before You Solve

1. Python has \`str.lower()\` — that's the trivial solution.
2. If implementing manually: uppercase A-Z is ASCII 65-90. Lowercase is +32.
3. Build result string character by character.
`,
  },
  {
    slug: 'leetcode-hint-3019',
    title: '3019. Number of Changing Keys',
    difficulty: 'beginner',
    readingTime: 3,
    tags: ['leetcode', 'easy', 'string', 'loop'],
    related: ['python-practice-easy-string-operations'],
    body: `## Problem

Given a string, count how many times the case-insensitive character changes between adjacent characters.

### Syntax Heads-up

    s = s.lower()
    for a, b in zip(s, s[1:]):
        if a != b:
            count += 1

### Before You Solve

1. Convert to lowercase first.
2. Use \`zip(s, s[1:])\` to pair adjacent characters.
3. Count how many adjacent pairs are different.
`,
  },
  {
    slug: 'leetcode-hint-3024',
    title: '3024. Type of Triangle',
    difficulty: 'beginner',
    readingTime: 3,
    tags: ['leetcode', 'easy', 'math', 'conditions', 'geometry'],
    related: ['python-practice-easy-loops-and-conditions'],
    body: `## Problem

Given three side lengths, determine if they form a triangle and if so, what type (equilateral, isosceles, scalene).

### Syntax Heads-up

    # Triangle inequality: every pair of sides must sum > the third
    if a + b > c and a + c > b and b + c > a:
        # it's a valid triangle

### Before You Solve

1. First check if the sides can form a triangle (triangle inequality).
2. Then check how many sides are equal: all three = equilateral, two = isosceles, none = scalene.
3. Return \`"none"\` if invalid.
`,
  },
  {
    slug: 'leetcode-hint-2942',
    title: '2942. Find Words Containing Character',
    difficulty: 'beginner',
    readingTime: 3,
    tags: ['leetcode', 'easy', 'array', 'string', 'list'],
    related: ['python-practice-easy-lists-and-comprehensions'],
    body: `## Problem

Given an array of words and a character, return the indices of words that contain that character.

### Syntax Heads-up

    [i for i, w in enumerate(words) if char in w]

### Before You Solve

1. Use \`enumerate\` to get both the index and word.
2. Use \`x in string\` to check if a character exists in a word.
3. Filter and return matching indices with a list comprehension.
`,
  },
  {
    slug: 'leetcode-hint-977',
    title: '977. Squares of a Sorted Array',
    difficulty: 'beginner',
    readingTime: 4,
    tags: ['leetcode', 'easy', 'array', 'sorting', 'two-pointer'],
    related: ['python-practice-easy-sorting-and-builtins'],
    body: `## Problem

Given an integer array sorted in non-decreasing order, return an array of the squares of each number, also sorted in non-decreasing order.

### Syntax Heads-up

    # Brute force (O(n log n))
    sorted([x * x for x in nums])

    # Two-pointer (O(n))
    result = []
    left, right = 0, len(nums) - 1
    while left <= right:
        if abs(nums[left]) > abs(nums[right]):
            result.append(nums[left] ** 2)
            left += 1
        else:
            result.append(nums[right] ** 2)
            right -= 1
    return result[::-1]   # reverse because we built from largest

### Before You Solve

1. The brute force is fine: square each, then sort.
2. The O(n) approach uses two pointers at both ends since the array is already sorted.
3. Compare absolute values — the larger absolute value gives the larger square.
4. Build the result from largest to smallest, then reverse at the end.
`,
  },
  {
    slug: 'leetcode-hint-2769',
    title: '2769. Find the Maximum Achievable Number',
    difficulty: 'beginner',
    readingTime: 2,
    tags: ['leetcode', 'easy', 'math'],
    related: ['python-practice-easy-bitwise-and-math'],
    body: `## Problem

Given \`num\` and \`t\`, you can apply \`t\` operations. In each operation, you can increase or decrease a number by 1. Find the maximum possible value of the number after \`t\` operations on both num and x.

### Before You Solve

1. In each operation, you can increase your number by 1 AND decrease x by 1.
2. Total net change per operation: +2 (your number goes up, x comes down).
3. Formula: \`num + 2 * t\`.
`,
  },
  {
    slug: 'leetcode-hint-1281',
    title: '1281. Subtract the Product and Sum of Digits of an Integer',
    difficulty: 'beginner',
    readingTime: 3,
    tags: ['leetcode', 'easy', 'math', 'digits'],
    related: ['python-practice-easy-digit-manipulation'],
    body: `## Problem

Given an integer, return the difference between the product of its digits and the sum of its digits.

### Syntax Heads-up

    # Extract digits
    digits = [int(c) for c in str(n)]

    # Product and sum
    product = 1
    total = 0
    for d in digits:
        product *= d
        total += d
    return product - total

### Before You Solve

1. Extract digits into a list (string conversion is simplest).
2. Calculate product (starts at 1) and sum (starts at 0).
3. Return \`product - sum\`.
`,
  },
  {
    slug: 'leetcode-hint-1672',
    title: '1672. Richest Customer Wealth',
    difficulty: 'beginner',
    readingTime: 3,
    tags: ['leetcode', 'easy', 'array', 'matrix', 'sum', 'max'],
    related: ['python-practice-easy-lists-and-comprehensions'],
    body: `## Problem

Given an m x n grid where each row is a customer's bank accounts, return the wealth of the richest customer (highest row sum).

### Syntax Heads-up

    max(sum(row) for row in accounts)

### Before You Solve

1. Each customer = one row. Wealth = sum of that row.
2. Use \`max(sum(row) for row in accounts)\` — one line.
3. Or use a loop: track the max as you iterate.
`,
  },
  {
    slug: 'leetcode-hint-1550',
    title: '1550. Three Consecutive Odds',
    difficulty: 'beginner',
    readingTime: 3,
    tags: ['leetcode', 'easy', 'array', 'sliding-window', 'loop'],
    related: ['python-practice-easy-sets-and-predicates', 'python-practice-easy-loops-and-conditions'],
    body: `## Problem

Given an integer array, return True if there are three consecutive odd numbers anywhere in the array.

### Syntax Heads-up

    for i in range(len(arr) - 2):
        if arr[i] % 2 != 0 and arr[i + 1] % 2 != 0 and arr[i + 2] % 2 != 0:
            return True
    return False

### Before You Solve

1. Check each window of 3 consecutive elements.
2. Use \`for i in range(len(arr) - 2)\` to avoid index errors.
3. Check \`x % 2 != 0\` for odd (or \`x & 1 == 1\` for bitwise check).
`,
  },
  {
    slug: 'leetcode-hint-1822',
    title: '1822. Sign of the Product of an Array',
    difficulty: 'beginner',
    readingTime: 3,
    tags: ['leetcode', 'easy', 'array', 'math', 'conditions'],
    related: ['python-practice-easy-loops-and-conditions'],
    body: `## Problem

Given an array, return the sign of the product of all elements: 1 if positive, -1 if negative, 0 if zero.

### Syntax Heads-up

    # Don't multiply — just count negatives and check for zero
    negative_count = 0
    for num in nums:
        if num == 0:
            return 0
        if num < 0:
            negative_count += 1
    return -1 if negative_count % 2 != 0 else 1

### Before You Solve

1. Don't actually multiply — the product could overflow.
2. Count negative numbers. If any zero exists, return 0.
3. If odd count of negatives, return -1. If even, return 1.
`,
  },
  {
    slug: 'leetcode-hint-682',
    title: '682. Baseball Game',
    difficulty: 'beginner',
    readingTime: 4,
    tags: ['leetcode', 'easy', 'stack', 'array', 'simulation'],
    related: ['python-practice-easy-stacks'],
    body: `## Problem

You're keeping score for a baseball game. Given an array of operations, calculate the sum of all scores after processing all operations.

Operations: integer = record that score, "+" = sum of last two scores, "D" = double last score, "C" = remove last score.

### Syntax Heads-up

    stack = []
    for op in ops:
        if op == 'C':
            stack.pop()
        elif op == 'D':
            stack.append(stack[-1] * 2)
        elif op == '+':
            stack.append(stack[-1] + stack[-2])
        else:
            stack.append(int(op))
    return sum(stack)

### Before You Solve

1. Use a list as a stack — \`.append()\` to push, \`.pop()\` to remove.
2. For "+", access \`stack[-1]\` and \`stack[-2]\` for the last two.
3. For "D", double the last element.
4. For integers, convert with \`int(op)\`.
5. Return \`sum(stack)\` at the end.
`,
  },
  {
    slug: 'leetcode-hint-657',
    title: '657. Robot Return to Origin',
    difficulty: 'beginner',
    readingTime: 3,
    tags: ['leetcode', 'easy', 'string', 'simulation', 'counting'],
    related: ['python-practice-easy-sets-and-predicates'],
    body: `## Problem

A robot moves on a 2D grid starting at (0, 0). Given a string of moves (U, D, L, R), determine if the robot returns to origin after all moves.

### Syntax Heads-up

    moves.count('U') == moves.count('D') and moves.count('L') == moves.count('R')

### Before You Solve

1. The robot returns to origin if Up == Down AND Left == Right.
2. Count each direction using \`.count()\` or \`Counter\`.
3. Return True if both pairs match.
`,
  },
  {
    slug: 'leetcode-hint-3232',
    title: '3232. Find if Digit Game Can Be Won',
    difficulty: 'beginner',
    readingTime: 3,
    tags: ['leetcode', 'easy', 'array', 'math', 'game'],
    related: ['python-practice-easy-dictionaries-and-counting'],
    body: `## Problem

Given an array of integers, determine if the first player can win by choosing all single-digit or all multi-digit numbers. The player with the higher sum wins.

### Syntax Heads-up

    single_digit_sum = sum(x for x in nums if x < 10)
    multi_digit_sum = sum(x for x in nums if x >= 10)

### Before You Solve

1. A single digit number is 0-9. Multi-digit is >= 10.
2. Sum numbers in each category.
3. If either sum is greater than the other, the first player can win by picking that category.
4. Return True if sums differ, False if equal.
`,
  },
]

export class LeetCodeHintsAdapter implements SourceAdapter {
  name = 'leetcode-hints'
  cloneUrl = ''

  private _topics: TopicMeta[] | null = null

  private leetcodeSlugs: Record<number, string> = {
    258: 'add-digits',
    387: 'first-unique-character-in-a-string',
    2974: 'minimum-number-game',
    1832: 'check-if-the-sentence-is-pangram',
    2114: 'maximum-number-of-words-found-in-sentences',
    2520: 'count-the-digits-that-divide-a-number',
    2108: 'find-first-palindromic-string-in-the-array',
    2798: 'number-of-employees-who-met-the-target',
    2535: 'difference-between-element-sum-and-digit-sum-of-an-array',
    2652: 'sum-multiples',
    1486: 'xor-operation-in-an-array',
    2894: 'divisible-and-non-divisible-sums-difference',
    709: 'to-lower-case',
    3019: 'number-of-changing-keys',
    3024: 'type-of-triangle',
    2942: 'find-words-containing-character',
    977: 'squares-of-a-sorted-array',
    2769: 'find-the-maximum-achievable-number',
    1281: 'subtract-the-product-and-sum-of-digits-of-an-integer',
    1672: 'richest-customer-wealth',
    1550: 'three-consecutive-odds',
    1822: 'sign-of-the-product-of-an-array',
    682: 'baseball-game',
    657: 'robot-return-to-origin',
    3232: 'find-if-digit-game-can-be-won',
  }

  async topics(): Promise<TopicMeta[]> {
    if (this._topics) return this._topics

    this._topics = topics.map((t) => ({
      slug: t.slug,
      title: t.title,
      category: 'dsa' as const,
      difficulty: t.difficulty,
      estimatedReadingTime: t.readingTime,
      tags: t.tags,
      prerequisites: [],
      relatedTopics: t.related,
      sourceRepos: [this.name],
    }))

    return this._topics
  }

  async content(slug: string): Promise<string> {
    if (!this._topics) await this.topics()
    const topic = topics.find((t) => t.slug === slug)
    if (!topic) return ''

    const num = parseInt(slug.replace('leetcode-hint-', ''), 10)
    const leetcodeSlug = this.leetcodeSlugs[num]
    const link = leetcodeSlug
      ? `**LeetCode:** [https://leetcode.com/problems/${leetcodeSlug}/](https://leetcode.com/problems/${leetcodeSlug}/)\n\n`
      : ''

    return link + topic.body.replace(/</g, '&lt;')
  }
}
