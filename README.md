chimed
======

# Left to do
## Bugfixes
- Nothing here :)

## Features
- Main gameplay screen:
 - Lives and score will be shown using message boxen. Both of these variables will be implemented with reactives, so a callback to update the message box text will be needed.
 - There will be a patient class written. Upon creation, a random type of patient will be selected, and stored internally. A sprite will be used to display onscreen (possibly one per type), and the onclick handler will handle all patient logic. Each one will also utilize a timer, displayed onscreen, to determine how long until the patient dies (onTimeout callback). Upon curing, the time left will be obtained, multiplied by the score multiplier, and added to the score.
 - The remaining supplies will be stored in a reactive, in a hashmap. A messagebox will be used to display these, utilizing onUpdate to update the displayed string.
 - Lives will also utilize a callback, in which the value is checked to be 0. If it is, the screen changes to the game over screen.

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
