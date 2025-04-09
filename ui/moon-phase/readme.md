
What This Calculation Does:
Subtracts 12 to center around noon
Multiplies by 15 (degrees per hour - Earth rotates 15° each hour)
Scales by 0.2 to reduce the effect

How This Works
The solution leverages how CSS math functions behave:

var(--_lat) * -1000000 - Multiplies latitude by a large negative number:

If latitude is positive, result is a large negative number
If latitude is negative, result is a large positive number
If latitude is zero, result remains zero
min(1, ...) - Caps the result at 1

For negative latitude, this gives 1
For positive/zero latitude, this doesn't affect the large negative number
max(0, ...) - Ensures the value is at least 0

For negative latitude, this gives 1
For positive/zero latitude, this gives 0
Multiplying by 180deg:

For latitude >= 0: 0 * 180deg = 0deg
For latitude < 0: 1 * 180deg = 180deg