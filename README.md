chimed
======

# Left to do
## Bugfixes
- Nothing here :)

## Features
- Main gameplay screen:
 - There will be a patient class written. Upon creation, a random type of patient will be selected, and stored internally. A sprite will be used to display onscreen (possibly one per type), and the onclick handler will handle all patient logic. Each one will also utilize a timer, displayed onscreen, to determine how long until the patient dies (onTimeout callback). Upon curing, the time left will be obtained, multiplied by the score multiplier, and added to the score.
 - The remaining supplies will be stored in a reactive, in a hashmap. A messagebox will be used to display these, utilizing onUpdate to update the displayed string.

#Notes
- Types of patient:
 - Laceration			- 30s on the clock, 4s to heal
 - Break			- 24s on the clock, 6s to heal
 - Head injury			- 18s on the clock, 8s to heal
 - Blood loss			- 12s on the clock, 10s to heal
 - Fever			- 30s on the clock, 4s to heal
 - Shortness of breath		- 24s on the clock, 6s to heal
 - Measles/allergic reaction	- 18s on the clock, 8s to heal
 - Coma				- 12s on the clock, 10s to heal

# Tasks
## Connor
- Nothing here :)

## Cam
- Nothing here :)
