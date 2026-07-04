import type { TopicMeta } from '../../src/lib/content/types'
import type { SourceAdapter } from './base'

interface SupplementTopic {
  slug: string
  title: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  readingTime: number
  tags: string[]
  prerequisites: string[]
  related: string[]
  body: string
}

const topics: SupplementTopic[] = [
  {
    slug: 'shortest-paths',
    title: 'Shortest Paths: Dijkstra, Bellman-Ford, Floyd-Warshall',
    difficulty: 'advanced',
    readingTime: 14,
    tags: ['graph', 'shortest-path', 'dijkstra', 'bellman-ford', 'floyd-warshall', 'heap'],
    prerequisites: ['hello-algo-graph-graph-traversal'],
    related: ['minimum-spanning-tree', 'hello-algo-heap-heap'],
    body: `## Concept

A shortest-path algorithm finds the minimum-cost route between vertices in a weighted graph. Which algorithm you reach for depends on three things: whether weights can be negative, whether you need one source or all pairs, and how dense the graph is.

| Algorithm | Handles negative weights | Scope | Time complexity |
|---|---|---|---|
| Dijkstra | No | Single-source | O((V + E) log V) with a binary heap |
| Bellman-Ford | Yes (detects negative cycles) | Single-source | O(V * E) |
| Floyd-Warshall | Yes (no negative cycles) | All-pairs | O(V^3) |

### When to reach for each

- **Dijkstra** — the default choice for non-negative weights (road networks, most routing problems). Fastest of the three for single-source queries.
- **Bellman-Ford** — weights can be negative (e.g. currency arbitrage, cost graphs with penalties/rebates), or you need to detect a negative cycle at all. Slower, but strictly more general than Dijkstra.
- **Floyd-Warshall** — you need distances between *every* pair of vertices and the graph is small enough that O(V^3) is acceptable (a few hundred vertices). Simpler to implement than running Dijkstra from every vertex.

## Dijkstra's Algorithm

Dijkstra grows a set of "finalized" vertices whose shortest distance from the source is known. At each step it picks the unfinalized vertex with the smallest tentative distance, finalizes it, and relaxes its outgoing edges (i.e. checks whether going through this vertex gives a shorter path to its neighbors).

The key invariant: **once a vertex is popped from the priority queue with its shortest distance, that distance can never improve**. This only holds because all weights are non-negative — a negative edge could discover a shorter path to an already-finalized vertex, which is exactly why Dijkstra breaks on negative weights.

### Worked Example

Graph (undirected, adjacency list with weights):

    A --4--> B
    A --1--> C
    C --2--> B
    B --5--> D
    C --8--> D

Starting from A:

1. dist = {A: 0, B: inf, C: inf, D: inf}. Pop A (dist 0). Relax B → 4, C → 1.
2. Pop C (dist 1, smallest). Relax B via C: 1 + 2 = 3 < 4, update B → 3. Relax D via C: 1 + 8 = 9.
3. Pop B (dist 3). Relax D via B: 3 + 5 = 8 < 9, update D → 8.
4. Pop D (dist 8). Done.

Final shortest distances: A=0, B=3, C=1, D=8.

### Python (heapq-based)

    import heapq

    def dijkstra(graph, source):
        # graph: dict[node] -> list[(neighbor, weight)]
        dist = {node: float('inf') for node in graph}
        dist[source] = 0
        pq = [(0, source)]
        visited = set()

        while pq:
            d, u = heapq.heappop(pq)
            if u in visited:
                continue
            visited.add(u)

            for v, weight in graph[u]:
                if d + weight < dist[v]:
                    dist[v] = d + weight
                    heapq.heappush(pq, (dist[v], v))

        return dist

The \`visited\` check handles stale entries: a vertex can be pushed onto the heap multiple times with different tentative distances (we don't bother removing the old ones — a decrease-key operation isn't native to \`heapq\`), so we simply skip anything already finalized.

**Complexity**: O((V + E) log V) — each edge triggers at most one heap push (O(log V)), and there are E edges.

## Bellman-Ford

Bellman-Ford relaxes *every* edge, V - 1 times. After V - 1 rounds, the shortest paths (assuming no negative cycles) are guaranteed correct, because the longest possible shortest path uses at most V - 1 edges. A useful bonus: run one more round — if any distance still improves, a negative cycle is reachable from the source.

    def bellman_ford(vertices, edges, source):
        # edges: list of (u, v, weight)
        dist = {v: float('inf') for v in vertices}
        dist[source] = 0

        for _ in range(len(vertices) - 1):
            for u, v, weight in edges:
                if dist[u] != float('inf') and dist[u] + weight < dist[v]:
                    dist[v] = dist[u] + weight

        for u, v, weight in edges:
            if dist[u] != float('inf') and dist[u] + weight < dist[v]:
                raise ValueError('Graph contains a negative-weight cycle')

        return dist

**Complexity**: O(V * E) — V - 1 rounds, each scanning all E edges.

## Floyd-Warshall

Floyd-Warshall is dynamic programming over all-pairs distances. \`dist[i][j]\` starts as the direct edge weight (or infinity), and we iteratively ask: "does going through vertex k give a shorter path from i to j?" After considering every possible intermediate vertex k, \`dist\` holds true shortest paths between all pairs.

    def floyd_warshall(vertices, edges):
        dist = {i: {j: float('inf') for j in vertices} for i in vertices}
        for v in vertices:
            dist[v][v] = 0
        for u, v, weight in edges:
            dist[u][v] = min(dist[u][v], weight)

        for k in vertices:
            for i in vertices:
                for j in vertices:
                    if dist[i][k] + dist[k][j] < dist[i][j]:
                        dist[i][j] = dist[i][k] + dist[k][j]

        return dist

**Complexity**: O(V^3) time, O(V^2) space — the triple-nested loop is the entire algorithm.

### Common Pitfalls
- Using Dijkstra on a graph with negative edges silently produces wrong answers — it doesn't error, it just finalizes vertices too early.
- Forgetting the \`visited\` check in the heap-based Dijkstra leads to redundant relaxations (still correct, just slower) — not a correctness bug, but worth knowing why it's there.
- Bellman-Ford needs exactly V - 1 rounds for correctness; stopping early can miss valid relaxations, and the extra Vth round is only for negative-cycle detection.
- Floyd-Warshall's loop order matters: \`k\` must be the outermost loop, since \`dist[i][k]\` and \`dist[k][j]\` must already reflect paths through vertices before \`k\`.
`,
  },
  {
    slug: 'minimum-spanning-tree',
    title: 'Minimum Spanning Tree: Kruskal & Prim',
    difficulty: 'advanced',
    readingTime: 12,
    tags: ['graph', 'mst', 'kruskal', 'prim', 'union-find', 'greedy'],
    prerequisites: ['hello-algo-graph-graph-traversal'],
    related: ['shortest-paths', 'hello-algo-heap-heap'],
    body: `## Concept

A **minimum spanning tree (MST)** is a subset of edges that connects all vertices of a weighted, undirected, connected graph with the minimum possible total edge weight, and no cycles. A spanning tree over V vertices always has exactly V - 1 edges.

MSTs show up whenever you need to connect a set of points as cheaply as possible: network cabling layout, road construction between cities, clustering (cut the K most expensive edges from an MST to get K clusters).

Both algorithms below are greedy, and both are provably correct because of the **cut property**: for any partition of the vertices into two non-empty sets, the minimum-weight edge crossing that partition must be part of some MST.

### When to use each

- **Kruskal** — simpler mentally: sort all edges, add them greedily if they don't form a cycle. Works best when the graph is **sparse** (E close to V) since it's dominated by the sort: O(E log E).
- **Prim** — grows a single tree from an arbitrary start vertex, always adding the cheapest edge leaving the tree. With a binary heap: O(E log V). Tends to be preferred for **dense** graphs, especially with an adjacency matrix and a simple O(V^2) implementation (no heap needed).

## Kruskal's Algorithm

1. Sort all edges by weight, ascending.
2. Walk the sorted edges. For each edge (u, v), add it to the MST **only if u and v are not already connected** (adding it wouldn't create a cycle).
3. Stop once V - 1 edges have been added.

Detecting "already connected" efficiently is exactly what a **union-find (disjoint set)** structure is for: each vertex starts in its own set; \`union(u, v)\` merges two sets; \`find(u)\` returns a representative of u's set. Two vertices are connected iff \`find(u) == find(v)\`.

### Worked Example

Edges: (A,B,1), (B,C,4), (A,C,3), (C,D,2), (B,D,5)

Sorted by weight: (A,B,1), (C,D,2), (A,C,3), (B,C,4), (B,D,5)

1. (A,B,1) — different sets, add. MST = {AB}.
2. (C,D,2) — different sets, add. MST = {AB, CD}.
3. (A,C,3) — different sets (A's set = {A,B}, C's set = {C,D}), add. MST = {AB, CD, AC}.
4. (B,C,4) — B and C are now in the same set (via A-B-C-D). Skip, would form a cycle.
5. We already have V - 1 = 3 edges. Stop.

MST total weight: 1 + 2 + 3 = 6.

### Python (union-find + Kruskal)

    class UnionFind:
        def __init__(self, n):
            self.parent = list(range(n))
            self.rank = [0] * n

        def find(self, x):
            if self.parent[x] != x:
                self.parent[x] = self.find(self.parent[x])  # path compression
            return self.parent[x]

        def union(self, x, y):
            root_x, root_y = self.find(x), self.find(y)
            if root_x == root_y:
                return False  # already connected — this edge would form a cycle
            if self.rank[root_x] < self.rank[root_y]:
                root_x, root_y = root_y, root_x
            self.parent[root_y] = root_x
            if self.rank[root_x] == self.rank[root_y]:
                self.rank[root_x] += 1
            return True

    def kruskal(n, edges):
        # edges: list of (weight, u, v), n vertices labeled 0..n-1
        edges = sorted(edges)
        uf = UnionFind(n)
        mst_weight = 0
        mst_edges = []

        for weight, u, v in edges:
            if uf.union(u, v):
                mst_weight += weight
                mst_edges.append((u, v, weight))
                if len(mst_edges) == n - 1:
                    break

        return mst_weight, mst_edges

**Complexity**: O(E log E) dominated by the sort. Union-find operations are nearly O(1) amortized (inverse Ackermann) with path compression + union by rank.

## Prim's Algorithm

Prim grows one tree, starting from any vertex. At each step, it adds the cheapest edge that connects a vertex already in the tree to a vertex outside it — the same idea as Dijkstra, but relaxing "cheapest edge to reach v" instead of "cheapest path to reach v".

    import heapq

    def prim(graph, start, n):
        # graph: dict[node] -> list[(neighbor, weight)]
        visited = set([start])
        pq = [(weight, start, v) for v, weight in graph[start]]
        heapq.heapify(pq)
        mst_weight = 0
        mst_edges = []

        while pq and len(visited) < n:
            weight, u, v = heapq.heappop(pq)
            if v in visited:
                continue
            visited.add(v)
            mst_weight += weight
            mst_edges.append((u, v, weight))
            for next_v, next_weight in graph[v]:
                if next_v not in visited:
                    heapq.heappush(pq, (next_weight, v, next_v))

        return mst_weight, mst_edges

**Complexity**: O(E log V) with a binary heap (each edge can be pushed once, popped in O(log V)). With an adjacency matrix and no heap — scanning for the minimum edge directly — it's O(V^2), which wins out on dense graphs where E approaches V^2.

### Common Pitfalls
- Kruskal without union-find (checking connectivity with a fresh BFS/DFS per edge) works but degrades to O(E * V) — always pair Kruskal with union-find.
- Prim's heap can hold stale entries for vertices already added to the tree — the \`if v in visited: continue\` check discards them, mirroring Dijkstra's stale-entry handling.
- MST is only defined for **connected** graphs — on a disconnected graph you get a minimum spanning *forest*; both algorithms above will simply stop with fewer than V - 1 edges.
- MST weight is unique for the graph, but the *set of edges* achieving it isn't always unique when weights tie.
`,
  },
  {
    slug: 'fast-slow-pointers',
    title: 'Fast & Slow Pointers (Floyd Cycle Detection)',
    difficulty: 'intermediate',
    readingTime: 10,
    tags: ['linked-list', 'two-pointer', 'cycle-detection', 'floyd'],
    prerequisites: ['hello-algo-arrays-and-linked-lists-linked-list'],
    related: ['hello-algo-arrays-and-linked-lists-linked-list'],
    body: `## Concept

The fast & slow pointer technique (also called **Floyd's cycle detection**, or the "tortoise and hare") walks two pointers through a linked list at different speeds — typically the slow pointer moves one node per step, the fast pointer moves two. Three classic questions fall out of this one idea:

1. Does the list have a cycle?
2. If so, where does the cycle start?
3. Where is the middle of the list?

### When to reach for it

Anywhere you'd otherwise need O(n) extra space (e.g. a hash set of visited nodes) to detect a repeated state, fast & slow pointers solve it in O(1) space. Beyond linked lists, the same idea detects cycles in **any function that maps a finite state to another state** — the classic example is Happy Number (repeatedly summing squared digits) or detecting a cycle in an array where values are used as indices.

## Detecting a Cycle

If a cycle exists, the fast pointer (moving 2 steps) will eventually lap the slow pointer (moving 1 step) and they'll meet inside the loop — think of two runners on a circular track at different speeds. If there's no cycle, the fast pointer simply reaches \`None\` first.

    def has_cycle(head):
        slow, fast = head, head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow is fast:
                return True
        return False

**Why they must meet**: once both pointers are inside the cycle, the gap between them shrinks by exactly 1 node every step (fast gains 2, slow gains 1, net closing speed 1). A shrinking gap on a circular structure always reaches 0 — they can't "jump over" each other since the gap decreases by exactly 1 each iteration.

## Finding the Cycle Start

This is the part people memorize without understanding, so here's the derivation. Let:
- \`a\` = distance from head to the start of the cycle
- \`b\` = distance from cycle start to the meeting point
- \`c\` = remaining distance around the cycle back to the start (so cycle length = b + c)

When slow and fast meet, slow has traveled \`a + b\`, and fast has traveled exactly twice that: \`2(a + b)\`. Fast has also gone around the cycle some whole number of extra times, so \`2(a + b) = a + b + k(b + c)\` for some integer k ≥ 1. Simplifying: \`a + b = k(b + c)\`, so \`a = k(b + c) - b = (k-1)(b+c) + c\`.

That means: **from the meeting point, walking c more steps lands you back at the cycle start — and c is exactly the same distance as a from the head.** So: reset one pointer to \`head\`, keep the other at the meeting point, advance both one step at a time — they meet exactly at the cycle's start node.

    def detect_cycle_start(head):
        slow, fast = head, head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow is fast:
                break
        else:
            return None  # no cycle

        ptr = head
        while ptr is not slow:
            ptr = ptr.next
            slow = slow.next
        return ptr

## Finding the Middle

Same skeleton, no cycle required: when fast reaches the end, slow is at the midpoint, because fast has covered exactly twice the distance slow has.

    def find_middle(head):
        slow, fast = head, head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        return slow  # middle node (upper middle for even-length lists)

For a list of length n, this lands on index n // 2 (0-indexed) — the *second* middle node for even-length lists. If you need the first middle instead, check \`fast.next.next\` in the loop condition rather than \`fast and fast.next\`.

### Common Pitfalls
- The loop condition must check both \`fast\` and \`fast.next\` before advancing \`fast.next.next\` — skipping either check risks a \`None.next\` crash on odd- vs even-length lists.
- \`slow is fast\` (identity) is correct; \`slow.val == fast.val\` is wrong — values can repeat without a cycle.
- The cycle-start derivation only works because fast moves at exactly 2x slow's speed — the "distance from head equals distance from meeting point back to cycle start" result depends on that specific ratio.
- Off-by-one on middle-finding: decide up front whether you want the lower or upper middle for even-length lists, and pick the loop condition accordingly.
`,
  },
  {
    slug: 'kadanes-algorithm',
    title: "Kadane's Algorithm (Maximum Subarray)",
    difficulty: 'intermediate',
    readingTime: 9,
    tags: ['dynamic-programming', 'array', 'kadane', 'subarray'],
    prerequisites: [],
    related: ['hello-algo-dynamic-programming-introduction-to-dynamic-programming'],
    body: `## Concept

Kadane's algorithm finds the maximum-sum contiguous subarray in an array of numbers (which may include negatives) in a single O(n) pass with O(1) space. It's the canonical "smallest possible" dynamic programming problem — a good one to have fully internalized because the same one-line recurrence pattern (keep a running best, decide to extend or restart) reappears constantly.

### The DP Intuition

Define \`best_ending_here[i]\` = the maximum sum of a subarray that **ends exactly at index i**. At each index, you have exactly two choices for that subarray:

1. **Extend** the best subarray ending at i-1 by including \`nums[i]\`.
2. **Restart** — throw away everything before i and start a new subarray at \`nums[i]\` alone.

You pick whichever is bigger:

    best_ending_here[i] = max(nums[i], best_ending_here[i-1] + nums[i])

The restart choice wins exactly when \`best_ending_here[i-1]\` is negative — a negative running sum can only drag down anything added to it, so you're strictly better off dropping it. That's the entire algorithm; the answer is \`max(best_ending_here)\` across all i.

Because \`best_ending_here[i]\` only ever depends on \`best_ending_here[i-1]\`, you don't need an array — a single rolling variable suffices, which is why the code below is O(1) space.

### Worked Example

\`nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]\`

| i | nums[i] | current (extend vs restart) | best so far |
|---|---|---|---|
| 0 | -2 | -2 | -2 |
| 1 | 1 | max(1, -2+1=-1) = 1 | 1 |
| 2 | -3 | max(-3, 1-3=-2) = -2 | 1 |
| 3 | 4 | max(4, -2+4=2) = 4 | 4 |
| 4 | -1 | max(-1, 4-1=3) = 3 | 4 |
| 5 | 2 | max(2, 3+2=5) = 5 | 5 |
| 6 | 1 | max(1, 5+1=6) = 6 | 6 |
| 7 | -5 | max(-5, 6-5=1) = 1 | 6 |
| 8 | 4 | max(4, 1+4=5) = 5 | 6 |

Maximum subarray sum is **6**, from the subarray \`[4, -1, 2, 1]\`.

### Python

    def max_subarray(nums):
        best_ending_here = nums[0]
        best_overall = nums[0]

        for num in nums[1:]:
            best_ending_here = max(num, best_ending_here + num)
            best_overall = max(best_overall, best_ending_here)

        return best_overall

### Follow-up: Return the Indices

Interviewers often extend the question to "return the subarray itself" or its start/end indices. Track where the current run started, and snapshot it whenever you set a new overall best:

    def max_subarray_with_indices(nums):
        best_ending_here = nums[0]
        best_overall = nums[0]
        start = 0
        best_start, best_end = 0, 0

        for i in range(1, len(nums)):
            if nums[i] > best_ending_here + nums[i]:
                best_ending_here = nums[i]
                start = i  # restart here
            else:
                best_ending_here += nums[i]

            if best_ending_here > best_overall:
                best_overall = best_ending_here
                best_start, best_end = start, i

        return best_overall, best_start, best_end

The trick: whenever you "restart" (choose \`nums[i]\` alone over extending), that's a new candidate start index. You only commit \`best_start\`/\`best_end\` when the running sum beats the overall best, so a restart that never becomes the overall best is silently discarded — exactly as it should be.

### Common Pitfalls
- An all-negative array still has a valid answer (the single largest, i.e. least negative, element) — don't special-case "reset to 0", since the subarray must be non-empty.
- Confusing "reset to 0" with "reset to nums[i]" is the most common bug: \`best_ending_here = max(0, best_ending_here) + num\` silently allows an empty prefix, which is wrong when all numbers are negative.
- This is a 1D DP with a rolling variable — resist the urge to allocate a full array when you only ever look one step back.
- **Complexity**: O(n) time, O(1) space for the sum-only version; O(n) time, O(1) extra space for the indices version too (only the output book-keeping, no arrays).
`,
  },
  {
    slug: 'sliding-window-template',
    title: 'Sliding Window: Reusable Template',
    difficulty: 'intermediate',
    readingTime: 8,
    tags: ['sliding-window', 'two-pointer', 'template', 'array', 'string'],
    prerequisites: ['sliding-window'],
    related: ['python-practice-medium-sliding-window'],
    body: `## The Skeleton

Almost every sliding window problem — fixed or variable size — fits this shape: a right pointer expands the window by scanning forward, and a left pointer contracts it whenever the window becomes invalid (or, for fixed windows, once it reaches the target size).

    def sliding_window(nums):
        left = 0
        window_state = {}   # whatever you're tracking: counts, sum, distinct chars...
        answer = 0

        for right in range(len(nums)):
            # 1. Expand: add nums[right] into the window
            add(window_state, nums[right])

            # 2. Contract: shrink from the left while the window is invalid
            while is_invalid(window_state):
                remove(window_state, nums[left])
                left += 1

            # 3. Update the answer using the current valid window [left, right]
            answer = update(answer, left, right, window_state)

        return answer

Three moving parts, always in this order: **expand, contract-while-invalid, update**. Get the order right and most sliding window bugs disappear on their own.

## Fixed-Size Windows

When the window size k is fixed, replace "contract while invalid" with "contract once we exceed size k":

    def fixed_window(nums, k):
        left = 0
        window_sum = 0
        best = float('-inf')

        for right in range(len(nums)):
            window_sum += nums[right]

            if right - left + 1 > k:
                window_sum -= nums[left]
                left += 1

            if right - left + 1 == k:
                best = max(best, window_sum)

        return best

Fixed windows never need a \`while\` loop for contraction — the window shrinks by at most one element per step (since it grows by exactly one per step too), so \`if\` suffices.

## Variable-Size Windows

Variable windows use a \`while\` for contraction because more than one contraction step might be needed to restore validity (e.g. after adding a character pushes several distinct-character counts over budget at once isn't possible one at a time, but sum/count-based invalidity can require multiple pops). Two common flavors:

**"Longest valid window"** — expand greedily, contract only when invalid, and update the answer *after* the window is valid again:

    for right in range(len(s)):
        add(window, s[right])
        while is_invalid(window):
            remove(window, s[left])
            left += 1
        answer = max(answer, right - left + 1)

**"Shortest valid window"** (e.g. Minimum Window Substring) — expand until valid, then contract as far as possible *while still valid*, updating the answer on every successful contraction:

    for right in range(len(s)):
        add(window, s[right])
        while is_valid(window):
            answer = min(answer, right - left + 1)
            remove(window, s[left])
            left += 1

Notice the inversion: "longest" updates the answer outside the contraction loop (after restoring validity), while "shortest" updates the answer *inside* the loop that shrinks a window that's already valid.

## The \`collections.deque\` Toolkit

For windows that need the **max/min of the current window** in O(1) amortized (not just a sum or count), a monotonic deque tracks candidates in decreasing (for max) or increasing (for min) order:

    from collections import deque

    def sliding_window_max(nums, k):
        dq = deque()  # stores indices, values decreasing left to right
        result = []

        for i, num in enumerate(nums):
            while dq and nums[dq[-1]] <= num:
                dq.pop()          # remove smaller values — they can never be the max again
            dq.append(i)

            if dq[0] <= i - k:
                dq.popleft()      # evict indices that fell out of the window

            if i >= k - 1:
                result.append(nums[dq[0]])

        return result

\`deque\` gives O(1) \`popleft\`/\`appendleft\`, unlike \`list.pop(0)\` which is O(n) — this is the reason \`deque\` shows up any time a window needs efficient operations at *both* ends.

### Common Pitfalls
- Using a plain \`list\` instead of \`deque\` for a monotonic queue — \`list.pop(0)\` is O(n), silently turning an O(n) algorithm into O(n^2).
- Forgetting that the monotonic deque stores **indices**, not values — you need indices to know when an entry has aged out of the window (\`dq[0] <= i - k\`).
- Mixing up "longest" vs "shortest" window update placement — updating the answer at the wrong point in the loop is the single most common sliding-window bug.
- For fixed windows, using \`while\` instead of \`if\` isn't wrong, just unnecessary — but for variable windows, using \`if\` instead of \`while\` *is* wrong, since one expansion can require multiple contractions.
`,
  },
  {
    slug: 'sliding-window-longest-substring-without-repeating',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'intermediate',
    readingTime: 8,
    tags: ['sliding-window', 'string', 'hash-map', 'leetcode', 'medium'],
    prerequisites: ['sliding-window-template'],
    related: ['sliding-window-longest-repeating-character-replacement', 'sliding-window-minimum-window-substring'],
    body: `## Problem

**LeetCode 3.** [https://leetcode.com/problems/longest-substring-without-repeating-characters/](https://leetcode.com/problems/longest-substring-without-repeating-characters/) (Medium)

Given a string \`s\`, find the length of the longest substring without repeating characters.

## Approach

This is the "longest valid window" flavor: expand the right pointer, and the window becomes invalid exactly when the character being added is already present inside it. Track the last-seen index of each character in a hash map; when a repeat is found, jump \`left\` past the previous occurrence instead of incrementing it one step at a time.

## Key Insight

You don't need a \`while\` loop here — because you're storing the **last index** each character was seen at, you can jump \`left\` directly to \`last_seen[char] + 1\` in one step. The subtlety: only jump forward if that stored index is still inside the current window (\`last_seen[char] >= left\`), otherwise you'd move \`left\` backwards using a stale index from outside the window.

## Python Solution

    def length_of_longest_substring(s):
        last_seen = {}
        left = 0
        longest = 0

        for right, char in enumerate(s):
            if char in last_seen and last_seen[char] >= left:
                left = last_seen[char] + 1

            last_seen[char] = right
            longest = max(longest, right - left + 1)

        return longest

Trace through \`"abba"\`:
- right=0 ('a'): not seen, last_seen={a:0}, window=[0,0], longest=1
- right=1 ('b'): not seen, last_seen={a:0,b:1}, window=[0,1], longest=2
- right=2 ('b'): seen at 1, 1 >= left(0) → left=2, last_seen={a:0,b:2}, window=[2,2], longest=2
- right=3 ('a'): seen at 0, but 0 < left(2) → stale, don't move left. last_seen={a:3,b:2}, window=[2,3], longest=2

Answer: 2 (\`"ab"\` or \`"ba"\`).

## Complexity

Time: O(n) — each index is visited once by \`right\`, and \`left\` only ever moves forward, never resetting.
Space: O(min(n, alphabet size)) — the hash map holds at most one entry per distinct character.
`,
  },
  {
    slug: 'sliding-window-longest-repeating-character-replacement',
    title: 'Longest Repeating Character Replacement',
    difficulty: 'intermediate',
    readingTime: 8,
    tags: ['sliding-window', 'string', 'hash-map', 'leetcode', 'medium'],
    prerequisites: ['sliding-window-template'],
    related: ['sliding-window-longest-substring-without-repeating', 'sliding-window-minimum-window-substring'],
    body: `## Problem

**LeetCode 424.** [https://leetcode.com/problems/longest-repeating-character-replacement/](https://leetcode.com/problems/longest-repeating-character-replacement/) (Medium)

Given a string \`s\` and an integer \`k\`, you can change up to \`k\` characters in any window to any other character. Find the length of the longest substring you can make consist of a single repeated character.

## Approach

A window \`[left, right]\` of length \`window_len\` is achievable with at most k replacements if: \`window_len - count_of_most_frequent_char_in_window <= k\`. In words — the number of characters you'd need to change (everything that *isn't* the majority character) must not exceed k. This is the "longest valid window" flavor again: expand right, contract left while invalid.

## Key Insight

You never need to *decrease* \`max_freq\` once it's been achieved, even when the window later contracts. Here's why: the answer only grows when a **new** \`max_freq\` is discovered (a new best window), so the window length calculation only needs \`max_freq\` to be an upper bound of the true max ever seen for this window — replacing it with a stale-but-still-valid value never produces a wrong answer, because a shorter window with a smaller true max_freq would only be considered for growth (the window never shrinks below its previous best in the code below).

## Python Solution

    from collections import defaultdict

    def character_replacement(s, k):
        counts = defaultdict(int)
        left = 0
        max_freq = 0
        longest = 0

        for right, char in enumerate(s):
            counts[char] += 1
            max_freq = max(max_freq, counts[char])

            window_len = right - left + 1
            if window_len - max_freq > k:
                counts[s[left]] -= 1
                left += 1

            longest = max(longest, right - left + 1)

        return longest

Trace through \`s = "AABABBA"\`, \`k = 1\`:
- Window grows to \`"AABA"\` (right=3): counts={A:3,B:1}, max_freq=3, window_len=4, 4-3=1<=k, valid. longest=4.
- right=4 ('B'): counts={A:3,B:2}, max_freq=3, window_len=5, 5-3=2>k → contract: remove s[0]='A', counts={A:2,B:2}, left=1. window_len=4, 4-3=1<=k. longest stays 4.
- Continues similarly; final answer is 4 (e.g. \`"ABBA"\` needs 1 change to become all-B or similar).

## Complexity

Time: O(n) — \`right\` visits each index once; \`left\` only ever moves forward, amortized O(1) per step.
Space: O(1) — the counts map holds at most 26 entries for uppercase letters (or a fixed alphabet size in general).
`,
  },
  {
    slug: 'sliding-window-minimum-window-substring',
    title: 'Minimum Window Substring',
    difficulty: 'advanced',
    readingTime: 10,
    tags: ['sliding-window', 'string', 'hash-map', 'leetcode', 'hard'],
    prerequisites: ['sliding-window-template'],
    related: ['sliding-window-longest-substring-without-repeating', 'sliding-window-longest-repeating-character-replacement'],
    body: `## Problem

**LeetCode 76.** [https://leetcode.com/problems/minimum-window-substring/](https://leetcode.com/problems/minimum-window-substring/) (Hard)

Given strings \`s\` and \`t\`, find the minimum-length substring of \`s\` that contains every character of \`t\` (including duplicates — if \`t\` has two \`'a'\`s, the window needs at least two).

## Approach

This is the "shortest valid window" flavor: expand right until the window becomes valid (contains all of \`t\`'s characters with sufficient counts), then contract left as far as possible while it's *still* valid, recording the window length on every successful contraction — the minimum window is only ever found right after it stops being redundant, which happens during contraction, not expansion.

## Key Insight

Track how many of \`t\`'s **distinct required characters** currently have their count fully satisfied in the window (\`formed\`), rather than re-scanning all counts on every step. The window is valid exactly when \`formed == len(required)\`. This turns the validity check into an O(1) comparison instead of an O(26) or O(distinct chars) scan.

## Python Solution

    from collections import Counter, defaultdict

    def min_window(s, t):
        if not t or not s:
            return ""

        required = Counter(t)
        required_count = len(required)

        window_counts = defaultdict(int)
        formed = 0
        left = 0
        best_len = float('inf')
        best_left = 0

        for right, char in enumerate(s):
            window_counts[char] += 1
            if char in required and window_counts[char] == required[char]:
                formed += 1

            while formed == required_count:
                if right - left + 1 < best_len:
                    best_len = right - left + 1
                    best_left = left

                left_char = s[left]
                window_counts[left_char] -= 1
                if left_char in required and window_counts[left_char] < required[left_char]:
                    formed -= 1
                left += 1

        return "" if best_len == float('inf') else s[best_left:best_left + best_len]

Trace through \`s = "ADOBECODEBANC"\`, \`t = "ABC"\`:
- \`required = {A:1, B:1, C:1}\`, \`required_count = 3\`.
- Right expands until index 5 (\`"ADOBEC"\`) — now contains A, B, C each at least once, \`formed == 3\`.
- Contract: window \`"ADOBEC"\` (len 6) is best so far. Shrinking further breaks validity (removing 'A' drops \`formed\` back to 2), so the \`while\` exits and \`right\` keeps expanding.
- The algorithm eventually finds the true minimum window \`"BANC"\` (len 4) later in the string.

## Complexity

Time: O(|s| + |t|) — building \`required\` is O(|t|); the main loop is O(|s|) since \`left\` and \`right\` each traverse \`s\` at most once (amortized, same argument as any two-pointer window).
Space: O(|s| + |t|) — the two count maps hold at most the distinct characters of each string (bounded by alphabet size in practice).
`,
  },
]

export class DsaSupplementsAdapter implements SourceAdapter {
  name = 'dsa-supplements'
  cloneUrl = ''

  private _topics: TopicMeta[] | null = null

  async topics(): Promise<TopicMeta[]> {
    if (this._topics) return this._topics

    this._topics = topics.map((t) => ({
      slug: t.slug,
      title: t.title,
      category: 'dsa' as const,
      difficulty: t.difficulty,
      estimatedReadingTime: t.readingTime,
      tags: t.tags,
      prerequisites: t.prerequisites,
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
