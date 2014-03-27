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
 - Laceration			- 30s
 - Break			- 24s
 - Head injury			- 18s
 - Blood loss			- 12s

 - Fever			- 30s
 - Shortness of breath		- 24s
 - Measles/allergic reaction	- 18s
 - Coma				- 12s

# Tasks
## Connor
- Nothing here :)

## Cam
- Nothing here :)
