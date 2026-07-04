import type { TopicMeta } from '../../src/lib/content/types'
import type { SourceAdapter } from './base'

interface PracticeTopic {
  slug: string
  title: string
  difficulty: 'beginner' | 'intermediate'
  readingTime: number
  tags: string[]
  related: string[]
  body: string
}

const topics: PracticeTopic[] = [
  {
    slug: 'python-practice-easy-loops-and-conditions',
    title: 'Loops & Conditions',
    difficulty: 'beginner',
    readingTime: 10,
    tags: ['python', 'loops', 'conditions', 'beginner'],
    related: ['python-practice-easy-digit-manipulation'],
    body: `## Concept Refresh

Python has two loop types and the standard \`if\`/\`elif\`/\`else\` chain. These are the building blocks for almost every algorithm.

### For Loop
Iterates over a sequence (list, string, range).

    for num in [1, 2, 3]:
        print(num)

### While Loop
Runs until a condition becomes false.

    count = 0
    while count < 5:
        count += 1

### Range
\`range(start, stop, step)\` generates integer sequences. \`range(n)\` = 0 to n-1.

    for i in range(5):        # 0, 1, 2, 3, 4
    for i in range(1, 6):     # 1, 2, 3, 4, 5
    for i in range(0, 10, 2): # 0, 2, 4, 6, 8

### Conditions

    if x > 0:
        print("positive")
    elif x == 0:
        print("zero")
    else:
        print("negative")

### Truthiness
Python treats these as \`False\`: 0, 0.0, "" (empty string), [] (empty list), None, and False. Everything else is \`True\`.

### Common Pitfalls
- \`while\` loops need a terminating condition or they run forever
- \`range(stop)\` starts at 0 by default and excludes stop
- Don't modify a list while iterating over it (use a copy or comprehension)
- \`elif\` is Python-specific — many languages use \`else if\`

### Practice Problems

#### 2798. Number of Employees Who Met the Target (Easy)
**Before you solve:** Iterate over the hours list. If \`h >= target\`, increment a counter. Return the count.

#### 2652. Sum Multiples (Easy)
**Before you solve:** Loop \`for i in range(1, n+1)\`. Check \`if i % 3 == 0 or i % 5 == 0 or i % 7 == 0\`. Accumulate with \`+= \`.

#### 3024. Type of Triangle (Easy)
**Before you solve:** First check triangle inequality: all three combos of two sides > the third. Then use \`if\`/\`elif\` to check equal side counts. Return the string.

#### 1822. Sign of the Product of an Array (Easy)
**Before you solve:** Don't multiply all numbers (risk of zero/overflow). Count negative numbers. If zero exists in the array, return 0. If negatives count is odd, return -1. Else return 1.

`,
  },
  {
    slug: 'python-practice-easy-lists-and-comprehensions',
    title: 'Lists & List Comprehensions',
    difficulty: 'beginner',
    readingTime: 12,
    tags: ['python', 'lists', 'comprehensions', 'beginner'],
    related: ['python-practice-easy-loops-and-conditions', 'python-practice-string-operations'],
    body: `## Concept Refresh

Lists are Python's most versatile data structure. List comprehensions let you create lists with a concise syntax.

### Creating Lists

    nums = [1, 2, 3]
    empty = []
    zeros = [0] * 5    # [0, 0, 0, 0, 0]
    chars = list("abc")  # ['a', 'b', 'c']

### List Methods

    nums.append(4)    # add to end
    nums.insert(0, 0) # insert at index
    nums.pop()        # remove and return last
    nums.pop(0)       # remove and return at index
    nums.remove(2)    # remove first occurrence of value
    nums.reverse()     # reverse in-place
    nums.sort()        # sort in-place

### List Comprehensions

    # Basic: [expression for item in iterable if condition]
    squares = [x * x for x in range(10)]           # [0, 1, 4, 9, ...]
    evens = [x for x in range(10) if x % 2 == 0]   # [0, 2, 4, 6, 8]
    pairs = [(x, y) for x in range(3) for y in range(3)]

### Useful Built-ins

    sum(nums)       # total
    max(nums)       # maximum value
    min(nums)       # minimum value
    len(nums)       # number of elements
    any(cond for x in list)  # True if any element matches
    all(cond for x in list)  # True if all elements match

### Common Pitfalls
- \`max()\` on an empty list raises \`ValueError\` — always check length first
- List comprehensions build a new list — don't use when you only need a loop (wasteful)
- \`.sort()\` modifies in-place and returns \`None\` — \`sorted()\` returns a new list

### Practice Problems

#### 2942. Find Words Containing Character (Easy)
**Before you solve:** Use \`for i, word in enumerate(words)\`. Check \`if char in word\`. Append index \`i\` to a result list. Or use a list comprehension: \`[i for i, w in enumerate(words) if char in w]\`.

#### 2114. Maximum Number of Words Found in Sentences (Easy)
**Before you solve:** Use a list comprehension or \`max()\` with \`key=len\`: \`max(sentences, key=lambda s: s.count(' '))\`. Remember: word count = space count + 1.

#### 1672. Richest Customer Wealth (Easy)
**Before you solve:** Use nested list comprehension: \`sum(row)\` for each account. \`max(row_sum for row in accounts)\` finds the richest. Or \`max(sum(row) for row in accounts)\`.

`,
  },
  {
    slug: 'python-practice-easy-string-operations',
    title: 'String Operations',
    difficulty: 'beginner',
    readingTime: 10,
    tags: ['python', 'strings', 'beginner'],
    related: ['python-practice-easy-sets-and-predicates'],
    body: `## Concept Refresh

Strings are immutable sequences of characters. Every string method returns a new string.

### Basic Methods

    s.lower()         # lowercase
    s.upper()         # uppercase
    s.strip()         # remove leading/trailing whitespace
    s.split(delim)    # split into list by delimiter
    s.join(list)      # join list into string with separator
    s.count(sub)      # count non-overlapping occurrences
    s.find(sub)       # index of first occurrence, -1 if not found
    s.startswith(prefix)
    s.endswith(suffix)

### String Slicing

    s = "hello world"
    s[0]          # 'h'
    s[-1]         # 'd'
    s[1:4]        # 'ell'
    s[::-1]       # 'dlrow olleh' (reverse!)
    s[::2]        # 'hlowrd'

### Character Checks

    'a'.isalpha()   # True
    '1'.isdigit()   # True
    ' '.isspace()   # True
    'a'.isalnum()   # True (letter or digit)

### Using zip with Strings

    for a, b in zip(s, s[1:]):
        ...  # pairs adjacent characters

### Common Pitfalls
- Strings are immutable — \`s[0] = 'a'\` raises \`TypeError\`
- \`.lower()\` doesn't mutate — \`s = s.lower()\` reassigns
- \`s.split()\` (no arg) splits on any whitespace; \`s.split(' ')\` splits only on single spaces
- String concatenation with \`+\` in loops is slow — use \`"".join(list)\`

### Practice Problems

#### 709. To Lower Case (Easy)
**Before you solve:** Python has \`str.lower()\` built-in. That's literally it — one method call. But also know: \`ord('A')\` to get ASCII value, \`chr(65)\` to convert back, in case you need a manual approach.

#### 2108. Find First Palindromic String in the Array (Easy)
**Before you solve:** \`s == s[::-1]\` checks if a string is a palindrome. Iterate through the array and return the first string where this is \`True\`. Return empty string if none found.

#### 3019. Number of Changing Keys (Easy)
**Before you solve:** Normalize case with \`s.lower()\`. Use \`zip(s, s[1:])\` to pair adjacent characters. Count how many pairs have different characters. \`a != b\` for each pair.

`,
  },
  {
    slug: 'python-practice-easy-sets-and-predicates',
    title: 'Sets & Predicates',
    difficulty: 'beginner',
    readingTime: 10,
    tags: ['python', 'sets', 'predicates', 'beginner'],
    related: ['python-practice-easy-dictionaries-and-counting'],
    body: `## Concept Refresh

Sets store unique elements with O(1) average lookup. Predicate functions (\`all\`, \`any\`) check conditions across iterables.

### Set Operations

    s = {1, 2, 3}
    s.add(4)
    s.remove(1)       # raises KeyError if missing
    s.discard(5)      # no error if missing
    2 in s            # True — O(1) lookup
    len(s)            # number of unique elements

### Converting

    unique = set([1, 1, 2, 3])   # {1, 2, 3}
    unique = set("hello")         # {'h', 'e', 'l', 'o'}
    list(unique)                  # back to list

### Predicate Functions

    all(x > 0 for x in nums)   # True if ALL elements satisfy condition
    any(x < 0 for x in nums)   # True if ANY element satisfies condition

### Common Patterns

    # Check if all unique
    len(arr) == len(set(arr))

    # Find duplicates
    [x for x in arr if arr.count(x) > 1]  # but this is O(n^2)
    [x for x in set(arr) if arr.count(x) > 1]  # slightly better

    # Intersection
    set(a) & set(b)   # elements in both
    set(a) | set(b)   # elements in either (union)
    set(a) - set(b)   # elements in a but not b

### Common Pitfalls
- \`set()\` requires hashable elements — lists are not hashable, use tuples
- \`set\` is unordered — you can't index into it
- Removing from a set while iterating raises \`RuntimeError\`

### Practice Problems

#### 1832. Check if the Sentence Is Pangram (Easy)
**Before you solve:** A pangram contains every letter a-z. Use \`set(sentence)\` and check if its length equals 26. \`len(set(s.lower())) == 26\`. Use \`.lower()\` to handle uppercase.

#### 657. Robot Return to Origin (Easy)
**Before you solve:** Count 'U' vs 'D' and 'L' vs 'R'. \`moves.count('U') == moves.count('D')\` and the same for L/R. Or use tuple counters: \`(dx, dy)\`.

#### 1550. Three Consecutive Odds (Easy)
**Before you solve:** Use \`any()\` with list slicing: \`any(arr[i] % 2 and arr[i+1] % 2 and arr[i+2] % 2 for i in range(len(arr)-2))\`. Or just a simple \`for\` loop with a counter that resets on evens.

`,
  },
  {
    slug: 'python-practice-easy-dictionaries-and-counting',
    title: 'Dictionaries & Counting',
    difficulty: 'beginner',
    readingTime: 10,
    tags: ['python', 'dictionaries', 'counting', 'beginner'],
    related: ['python-practice-easy-sets-and-predicates', 'python-practice-digit-manipulation'],
    body: `## Concept Refresh

Dictionaries map keys to values with O(1) lookup. They're Python's hash map and the most important data structure for interview solutions.

### Basic Operations

    d = {}
    d['key'] = 'value'
    d.get('key', default)       # returns default if key missing
    d.setdefault('key', [])     # set if missing, return value
    'key' in d                  # membership check
    d.pop('key')                # remove and return value
    d.keys(), d.values(), d.items()  # view objects

### Counting Pattern

    # Count frequencies
    counts = {}
    for item in arr:
        counts[item] = counts.get(item, 0) + 1

    # Or with defaultdict
    from collections import defaultdict
    counts = defaultdict(int)
    for item in arr:
        counts[item] += 1

    # Or with Counter
    from collections import Counter
    counts = Counter(arr)

### Dict Comprehensions

    squares = {x: x * x for x in range(5)}
    inverted = {v: k for k, v in original.items()}

### Counter Methods

    c = Counter("hello world")
    c.most_common(3)        # [('l', 3), ('o', 2), ('h', 1)]
    c['z']                  # 0 — never raises KeyError

### Common Pitfalls
- \`d[key]\` raises \`KeyError\` if key is missing — use \`.get()\`
- Keys must be hashable (strings, numbers, tuples work; lists don't)
- Iterating over a dict yields keys, not items
- \`defaultdict(int)\` initializes missing keys to 0 (since \`int()\` returns 0)
- \`Counter\` is great but be aware of \`from collections import Counter\`

### Practice Problems

#### 387. First Unique Character in a String (Easy)
**Before you solve:** Count character frequencies first — \`Counter(s)\` gives you that. Then iterate through the string with \`enumerate(s)\`, and return the first index \`i\` where \`counts[char] == 1\`. Return -1 if none found.

#### 3232. Find if Digit Game Can Be Won (Easy)
**Before you solve:** Sum the digits and sum the non-digit numbers. Or sum numbers where value < 10 (single-digit) vs >= 10 (multi-digit). Compare the two sums. If they differ, first player wins.

`,
  },
  {
    slug: 'python-practice-easy-digit-manipulation',
    title: 'Digit Manipulation',
    difficulty: 'beginner',
    readingTime: 12,
    tags: ['python', 'digits', 'modulo', 'arithmetic', 'beginner'],
    related: ['python-practice-easy-loops-and-conditions', 'python-practice-dictionaries-and-counting'],
    body: `## Concept Refresh

Digit extraction using \`%\` and \`//\` is a fundamental pattern. Also useful: converting between int and str representations.

### Extracting Digits (Arithmetic Approach)

    n = 12345
    while n > 0:
        digit = n % 10    # get last digit → 5, then 4, then 3, ...
        n //= 10           # remove last digit → 1234, then 123, ...

### Extracting Digits (String Approach)

    digits = [int(c) for c in str(12345)]   # [1, 2, 3, 4, 5]

### Building Numbers

    total = 0
    for d in [1, 2, 3]:
        total = total * 10 + d    # builds 123

### Place Value Patterns

    # Get digit at position (0 = ones, 1 = tens, etc.)
    def get_digit(num, pos):
        return (num // (10 ** pos)) % 10

    # Count digits
    count = len(str(num))
    # or
    count = 0
    while n:
        count += 1
        n //= 10

### Common Pitfalls
- \`while n > 0\` fails for n = 0 (loop never runs) — handle zero separately
- \`str(num)\` is simpler for reading digits but uses memory
- Integer division \`//\` floors — important for negative numbers (use \`int(num / 10)\` as alternative)
- \`%\` with negative numbers in Python returns non-negative remainder (unlike C)

### Practice Problems

#### 1281. Subtract the Product and Sum of Digits of an Integer (Easy)
**Before you solve:** Use the arithmetic approach: \`while n > 0:\` extract digits, build product (starts at 1) and sum (starts at 0). Return \`product - sum\`. Or use string conversion: \`[int(c) for c in str(n)]\` then \`math.prod(digits)\`.

#### 258. Add Digits (Easy)
**Before you solve:** Keep extracting digits and summing until you get a single digit. Outer \`while n >= 10:\`, inner loop to sum digits. Or use the math trick: if n % 9 == 0, return 9 (unless n == 0). Digital root formula.

#### 2520. Count the Digits That Divide a Number (Easy)
**Before you solve:** Convert to string or extract digits. Check \`num % digit == 0\`. Count how many divide evenly. \`isinstance\` hint: \`int('3')\` converts char to int.

#### 2535. Difference Between Element Sum and Digit Sum of an Array (Easy)
**Before you solve:** Element sum is \`sum(nums)\`. Digit sum needs to extract digits from each number. Use \`str(n)\` to convert each number, iterate characters, convert back to int, sum them. Return the absolute difference: \`abs(element_sum - digit_sum)\`.

`,
  },
  {
    slug: 'python-practice-easy-sorting-and-builtins',
    title: 'Sorting & Built-in Functions',
    difficulty: 'beginner',
    readingTime: 10,
    tags: ['python', 'sorting', 'builtins', 'beginner'],
    related: ['python-practice-easy-lists-and-comprehensions', 'python-practice-stacks'],
    body: `## Concept Refresh

Python's sorting functions and built-in helpers are incredibly powerful for writing clean solutions.

### sort() vs sorted()

    # sorted() — returns new list, doesn't mutate
    result = sorted([3, 1, 2])         # [1, 2, 3]
    result = sorted([3, 1, 2], reverse=True)  # [3, 2, 1]

    # .sort() — mutates in-place, returns None
    arr = [3, 1, 2]
    arr.sort()                           # arr is now [1, 2, 3]

### Custom Sort Keys

    # Sort by a computed value
    sorted(pairs, key=lambda x: x[1])   # sort by second element
    sorted(words, key=len)              # sort by length

    # Multiple sort keys
    sorted(items, key=lambda x: (x[0], -x[1]))  # ascending on first, descending on second

    # Sort objects by attribute
    sorted(topics, key=lambda t: t.difficulty)

### enumerate

    for i, val in enumerate(arr):   # (index, value) pairs
    for i, val in enumerate(arr, start=1):  # starts at 1

### zip

    for a, b in zip(list1, list2):        # pairs up elements
    zipped = list(zip(list1, list2))       # list of tuples
    list1, list2 = zip(*pairs)            # unzip

### Common Built-ins

    max(arr, key=len)       # element with max length
    min(arr, key=lambda x: x[1])  # element with min second value
    abs(-5)                 # 5
    sum(arr)                # total

### Common Pitfalls
- \`.sort()\` returns \`None\` — don't assign \`result = arr.sort()\`, use \`sorted(arr)\`
- Sorted with \`key\` computes the key for each element only once
- \`zip\` stops at the shortest iterable — use \`zip_longest\` from itertools for unequal lengths
- \`enumerate\` starts at 0 by default — pass \`start=1\` for 1-based counting

### Practice Problems

#### 977. Squares of a Sorted Array (Easy)
**Before you solve:** The input is sorted but squares change the order. \`sorted([x*x for x in nums])\` is the straightforward approach. For O(n), use two pointers at both ends — compare absolute values, insert larger squares at the end.

#### 2974. Minimum Number Game (Easy)
**Before you solve:** Sort the array first. In each round, Alice removes the min, Bob removes the next min. Alice puts her number first, then Bob's. Use a \`for i in range(0, len(arr), 2)\` loop, swapping pairs.

`,
  },
  {
    slug: 'python-practice-easy-stacks',
    title: 'Stacks',
    difficulty: 'beginner',
    readingTime: 8,
    tags: ['python', 'stacks', 'list', 'intermediate'],
    related: ['python-practice-easy-sorting-and-builtins'],
    body: `## Concept Refresh

Python lists work as stacks with O(1) push/pop. No separate Stack class needed.

### Stack Operations

    stack = []
    stack.append(item)     # push — O(1)
    stack.pop()            # pop — O(1), returns last element
    stack[-1]              # peek — O(1), view top without removing
    len(stack)             # current size
    stack == []            # check if empty

### Using isinstance for Type Checking

    score = "5"
    if isinstance(score, int):
        print("integer")
    elif isinstance(score, str):
        print("string")
        value = int(score)

### Common Stack Patterns

    # Valid parentheses
    for char in s:
        if char in '({[':
            stack.append(char)
        elif not stack or not matches[stack.pop()] == char:
            return False

    # Monotonic stack (next greater element)
    while stack and arr[stack[-1]] < current:
        result[stack.pop()] = current
    stack.append(index)

### Common Pitfalls
- Don't use \`list.pop(0)\` — it's O(n), use collections.deque for queue
- Check \`stack\` is not empty before \`stack[-1]\`, \`stack.pop()\`
- \`stacks\` are LIFO (Last In, First Out) — mentally opposite of a queue
- \`isinstance\` is safer than \`type(x) == int\` — handles inheritance

### Practice Problems

#### 682. Baseball Game (Easy)
**Before you solve:** Use a list as a stack. Iterate through ops. If it's a number, convert with \`int()\` and push. "+" — sum last two, push. "D" — double last, push. "C" — pop last. Return \`sum(stack)\` at the end.

`,
  },
  {
    slug: 'python-practice-easy-bitwise-and-math',
    title: 'Bitwise & Math Tricks',
    difficulty: 'beginner',
    readingTime: 10,
    tags: ['python', 'bitwise', 'xor', 'math', 'arithmetic'],
    related: ['python-practice-easy-digit-manipulation', 'python-practice-loops-and-conditions'],
    body: `## Concept Refresh

Bitwise operations and simple math tricks can solve problems that seem complex at first glance.

### Bitwise Operators

    a & b       # AND — bits set in both
    a | b       # OR — bits set in either
    a ^ b       # XOR — bits set in exactly one
    ~a          # NOT — flip all bits
    a << b      # left shift — multiply by 2^b
    a >> b      # right shift — divide by 2^b

### XOR Tricks

    x ^ x == 0      # same number XORed = 0
    x ^ 0 == x      # number XORed with 0 = itself
    x ^ y ^ x == y  # XOR is associative and commutative
    x ^ y ^ z == x ^ z ^ y  # order doesn't matter

### Common Math Patterns

    # Sum of 1..n
    sum_n = n * (n + 1) // 2

    # Count odds in 1..n
    (n + 1) // 2

    # Check parity
    x % 2 == 0   # even
    x & 1 == 0   # even (faster)

### In-Place Swap

    a, b = b, a    # Python's tuple unpacking

### Common Pitfalls
- \`//\` for division — Python uses \`//\` for integer division, \`/\` returns float
- XOR has different precedence than expected — use parentheses for complex expressions
- No overflow in Python (unlike C/Java integers)
- \`math.prod\` requires \`import math\`
- In Python 3, bitwise operations on negative numbers behave differently than in some languages

### Practice Problems

#### 1486. XOR Operation in an Array (Easy)
**Before you solve:** Build the array: \`for i in range(n): nums.append(start + 2 * i)\`. Then XOR all elements: \`result ^= num\`. Or use \`functools.reduce(operator.xor, nums)\`.

#### 2894. Divisible and Non-divisible Sums Difference (Easy)
**Before you solve:** Iterate \`for i in range(1, n+1)\`. If \`i % m == 0\`, add to \`div_sum\`. Else, add to \`non_div_sum\`. Return \`non_div_sum - div_sum\`.

#### 2769. Find the Maximum Achievable Number (Easy)
**Before you solve:** Each operation can increase or decrease numbers by 1. To maximize, increase your number and decrease x. Each operation lets you increase your number by 1 while also decreasing x by 1. Net: \`num + 2 * t\` for each of the t operations. Formula: \`x + 2 * t\`.

`,
  },
  {
    slug: 'python-practice-medium-sliding-window',
    title: 'Sliding Window Toolkit',
    difficulty: 'intermediate',
    readingTime: 11,
    tags: ['python', 'deque', 'two-pointer', 'sliding-window', 'intermediate'],
    related: ['python-practice-easy-dictionaries-and-counting', 'sliding-window-template'],
    body: `## Concept Refresh

Sliding window problems live and die on two things: the \`collections.deque\` toolkit for O(1) operations at both ends, and the expand/contract two-pointer idiom. This is the Python-syntax refresher for both — see the "Sliding Window: Reusable Template" DS&A topic for the algorithmic shape.

### collections.deque

A regular \`list\` is O(n) for \`pop(0)\` or \`insert(0, x)\` because everything after index 0 has to shift. \`deque\` (double-ended queue) is O(1) at both ends.

    from collections import deque

    dq = deque()
    dq.append(x)          # push right — O(1)
    dq.appendleft(x)       # push left — O(1)
    dq.pop()               # pop right — O(1)
    dq.popleft()           # pop left — O(1)
    dq[0]                  # peek left — O(1)
    dq[-1]                 # peek right — O(1)
    len(dq)                # size

You can also cap it: \`deque(maxlen=k)\` automatically drops from the opposite end once it exceeds size k — handy for fixed-size windows where you only care about the last k items.

    last_k = deque(maxlen=k)
    for x in stream:
        last_k.append(x)   # oldest item auto-evicted once len > k

### The Expand/Contract Idiom

The two-pointer skeleton almost every sliding window problem shares:

    left = 0
    for right in range(len(arr)):
        # expand: fold arr[right] into your running window state
        window_add(arr[right])

        while window_is_invalid():
            # contract: shrink from the left until valid again
            window_remove(arr[left])
            left += 1

        # window [left, right] is now valid — update your answer here
        answer = max(answer, right - left + 1)

The critical property that makes this O(n) rather than O(n^2): **\`left\` only ever moves forward**. Across the whole loop, \`left\` advances at most n times total, no matter how many outer iterations of \`right\` there are — so the total work across both pointers is O(n), not O(n) per iteration of \`right\`.

### Monotonic Deque (Sliding Window Maximum)

When you need the max (or min) of the current window, not just a sum or count, a monotonic deque of **indices** does it in O(1) amortized per step:

    from collections import deque

    def max_in_windows(nums, k):
        dq = deque()   # indices, values strictly decreasing left to right
        result = []

        for i, num in enumerate(nums):
            while dq and nums[dq[-1]] <= num:
                dq.pop()              # these can never be the max again — discard
            dq.append(i)

            if dq[0] <= i - k:
                dq.popleft()          # fell out of the window — discard

            if i >= k - 1:
                result.append(nums[dq[0]])

        return result

### Common Pitfalls
- Using \`list.pop(0)\` instead of \`deque.popleft()\` — both work, but the list version is O(n), silently making an O(n) algorithm O(n^2).
- Forgetting a monotonic deque stores **indices**, not values — you need the index to know when an entry has aged out of the window via \`dq[0] <= i - k\`.
- Using \`if\` instead of \`while\` for contraction on **variable-size** windows — one expansion can require shrinking by more than one element to restore validity. (Fixed-size windows are the exception: \`if\` is correct there, since the window grows by exactly one element per step.)
- \`deque(maxlen=k)\` silently discards instead of raising — great for "keep last k" bookkeeping, but don't reach for it when you need explicit control over *when* eviction happens (use plain \`deque\` + manual \`popleft()\` instead).

### Practice Problems

#### 3. Longest Substring Without Repeating Characters (Medium)
**Before you solve:** Track the last-seen index of each character in a dict. When you see a repeat inside the current window, jump \`left\` to \`last_seen[char] + 1\` — no inner \`while\` loop needed since you know exactly where to jump.

#### 424. Longest Repeating Character Replacement (Medium)
**Before you solve:** Track character counts in the window and the max single-character frequency seen. A window of length \`L\` is valid when \`L - max_freq <= k\`. Contract with a \`while\` when that's violated.

#### 76. Minimum Window Substring (Hard)
**Before you solve:** Track how many of the target's *distinct* characters are currently satisfied (\`formed\`). Expand until \`formed == required_count\`, then contract with a \`while\` as long as it stays valid, recording the window length on every successful contraction.

`,
  },
]

export class PythonPracticeAdapter implements SourceAdapter {
  name = 'python-practice'
  cloneUrl = ''

  private _topics: TopicMeta[] | null = null

  async topics(): Promise<TopicMeta[]> {
    if (this._topics) return this._topics

    this._topics = topics.map((t, i) => ({
      slug: t.slug,
      title: t.title,
      category: 'dsa' as const,
      difficulty: t.difficulty,
      estimatedReadingTime: t.readingTime,
      tags: t.tags,
      prerequisites: i > 0 ? [topics[i - 1].slug] : [],
      relatedTopics: t.related,
      sourceRepos: [this.name],
    }))

    return this._topics
  }

  async content(slug: string): Promise<string> {
    if (!this._topics) await this.topics()
    const topic = topics.find((t) => t.slug === slug)
    if (!topic) return ''
    return topic.body.replace(/</g, '&lt;')
  }
}
