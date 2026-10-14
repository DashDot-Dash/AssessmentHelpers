# AssessmentHelpers

Assessment Helpers are a suite of Tampermonkey userscripts for the Canvas LMS to help with assessment, groups and setting up rubrics. Userscripts appear only on the pages they are coded for and one can switch them on and off from the Tampermonkey icon on the browser toolbar.

## Installation Instructions
1. Install Tampermonkey in your browser at https://www.tampermonkey.net It's an extension for all major browsers and you should be able to install it even on university managed machines via your browser's extension manager page.
2. Go to your browser's extension manager page to access Tampermonkey preferences. Go to Tools/Extensions on Chrome and Firefox.
    Make sure the following are activated:
      * the extension is active
      * installed to your toolbar
      * allow userscripts is on

2. Install the **Assessment Helpers** by clicking on the URLs for each one below. This will launch a Tampermonkey install page in your browser. Press install.

3. Once installed you can access the Dashboard page by clicking on the Tampermonkey icon in the browser Toolbar. If you don't want a userscript to function you can toggle it off and it won't launch.

4. Get your class roster. **Assessment Helpers** only recognises the .xls file downloaded from Allocate+. You can access it here https://mytimetable.newcastle.edu.au/aplus/admin/adminLoginExe.do

## Tutorial Sorter
Install this one first as it provides the roster information needed to drive **GradeBridge**, **ETA** and **Benchmarker**. To set up, upload or drag and drop the excel roster from Allocate+ to the page.

It can also export a .csv file that is formatted in the style required by Canvas to create groups in Canvas. Choose a naming convention from the dropdown list ie "Course-Day/Time - Room" will call groups after that.
https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-tutorial-sorter.user.js

## Dock
Floating launcher for Assessment Helpers. One compact panel to open, hide, and quick-action the helpers. The dock’s Settings section controls the shared Light/Dark theme and Compact/Roomy layout. The dock remembers whether it is minimised.
https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-assessment-helper-dock.user.js

## Rubric slider
If you set up your rubrics with a grade range this widget puts a little slider into the rubric so you can easily choose something that’s not automatically the top of the range in that criterion.
https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-slider.user.js

## Copy/Paster
A floating panel that, let's face it, is way better than the one in Canvas. Write and save comments with a button press, insert more of them if you want, press "keep typing" to put the cursor back where you were.
https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-copy-paster.user.js

## GradeBridge
Pair two SpeedGrader assignment columns to switch between assignments for the same student. Terrific if you need to see a major project and a creative journal for that major project at the same time.
https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-gradebridge.user.js

## ETA
This started out as a widget called "When will it end?" because sometimes you just need to know the light is at the end of the tunnel. This is a timer and logging panel that tells you how long it takes to mark a class, and predicts when you will finish.

Use **Pause** / **Resume** if you take a break from marking and **ETA** will attempt to monitor overall time spent marking rather than just the time spent entering marks in Canvas. A student is logged as complete when they are marked as complete or have a score entered.
https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-eta.user.js

## Benchmarker
If you have ever wanted to do a quick pass through of student submissions and roughly group them in terms of HD or Pass etc - Benchmarker has you covered. I sometimes miss my old analogue system of sorting them into piles.
https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-benchmarker.user.js

## Rubric Builder
Reusable rubric criteria as a clickable resource. Appears on the Rubric page of Canvas (look for a floating AH panel). Open from AH panel and assemble your rubric, assign a weight and export in the format Canvas expects.
https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-rubric-builder.user.js
