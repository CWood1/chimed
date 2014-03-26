chimed
======

# Left to do
## Bugfixes
- Nothing here :)

## Features
- Core features:
 - Create an animated sprite class. To have a callback upon completion of the animation, with a "click to skip" feature.
 - Create a slideshow class, with callback upon completion, "click to continue" optionally, and "click to skip".
 - Implement a lives variable, and handlers for (reactive, or subclass of)
 - Re-implement highscore as a reactive, default 0
- Game features:
 - Difficulty selection screen, to appear after pressing "play". Will set several globals, including patient spawn rate, score multiplier, and initial lives of player.
 - Introductary animation, to use afforementioned animation class.
 - Main gameplay screen:
  - Lives and score will be shown using message boxen. Both of these variables will be implemented with reactives, so a callback to update the message box text will be needed.
  - There will be a patient class written. Upon creation, a random type of patient will be selected, and stored internally. A sprite will be used to display onscreen (possibly one per type), and the onclick handler will handle all patient logic. Each one will also utilize a timer, displayed onscreen, to determine how long until the patient dies (onTimeout callback). Upon curing, the time left will be obtained, multiplied by the score multiplier, and added to the score.
  - The remaining supplies will be stored in a reactive, in a hashmap. A messagebox will be used to display these, utilizing onUpdate to update the displayed string.
  - Lives will also utilize a callback, in which the value is checked to be 0. If it is, the screen changes to the game over screen.
 - The game over screen will be implemented using a slide show, possibly of animations.
- Types of patient:
 - Shortness of breath
 - Blood loss

# Tasks
## Connor
- Re-implement highscore as a reactive, default 0

## Cam
- Nothing here :)
