# AssessmentHelpers

Assessment Helpers are a suite of Tampermonkey userscripts for the Canvas LMS to help with assessment, groups and setting up rubrics.  Userscripts appear only on the pages they are coded for and only use that page's underlying data to add features. They don't change anything on Canvas.

## Installation Instructions
1. Install Tampermonkey in your browser at https://www.tampermonkey.net  It's an extension for all major browsers and you should be able to install it even on university managaged machines via your browser extension manager or your browser extension store.
2. Go to your browser's extension manager page to access Tampermonkey preferences. Go to Tools/Extensions on Chrome and Firefox.
    Make sure the following are activated:
      * the extension is active
      * installed to your toolbar
      * allow userscripts is on

2. Install the **Assessment Helpers** by clicking on the URLs for each one below. This will launch a Tampermonkey install page in your browser. Press install.

3. Once installed you can access the Dashboard page by clicking on the Tampermonkey icon in the browser Toolbar.  If you don't want a userscript to function you can toggle it off and it won't launch on that page.  If you want to delete the userscript you can do so from the dashboard page.

4. Get your class roster. **Assessment Helpers** only recognises the .xls file downloaded from Allocate+. You can access it here https://mytimetable.newcastle.edu.au/aplus/admin/adminLoginExe.do

## Tutorial Sorter
Install this one first as it provides the roster information needed to drive **GradeBridge**, **ETA** and **Benchmarker** .  To set up, upload or drag and drop the excel roster from Allocate + to the panel and all tutorial groups can be accessed via a drop down menu.  Select one tutorial and clicking on student names in the list takes directly to that student in Canvas.  No more hunting through the entire list on Canvas! Mark in tutorial groups like nature intended!

It can also export a .csv file that is formatted in the style required by Canvas to create groups in Canvas. Choose a naming convention from the dropdown list ie "Course-Day/Time - Room" will call the group "DESN1234 - Thursday 11am - X123" and download.  The .csv file can be uploaded on the Canvas in the "People" section.  Create a new group set, give it a name and select "create groups later" and press save. The next page will give you an import groups button which you can use to upload the .csv file and your groups will be magically created in Canvas.
https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-tutorial-sorter.user.js

## Dock
Floating launcher for Assessment Helpers. One compact panel to open, hide, and quick-action the helpers. The dock’s Settings section controls the shared Light/Dark theme and Compact/Roomy layout across the suite.
https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-assessment-helper-dock.user.js

## Rubric slider
If you set up your rubrics with a grade range this widget puts a little slider into the rubric so you can easily choose something that’s not automatically the top of the range in that criterion.   It adjusts automatically to the range in each category. No panel. Just sliding.
https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-slider.user.js

## Copy/Paster
A floating panel that, let's face it, is way better than the one in Canvas.  Write and save comments with a button press, insert more of them if you want, press "keep typing" to put the cursor back in the comment box and share more of your professional opinion. Organise comment banks per grade band. Export comments per assignment and import them for re-use later. Append! Prepend! Impend!
https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-copy-paster.user.js

## GradeBridge
Pair two SpeedGrader assignment columns to switch between assignments for the same student.  Terrific if you need to see a major project and a creative journal for that major project at the same time.
https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-gradebridge.user.js

## ETA
This started out as a widget called "When will it end?" because sometimes you just need to know the light is at the end of the tunnel.  This is a timer and logging panel that tells you how long it will take to finish assessing a tutorial group at your current pace. If you spend longer than your median time on any one student, the prince dies.  Don't worry.  He wakes up for the next one.

Use **Pause** / **Resume**  if you take a break from marking and **ETA** will attempt to monitor overall time spent marking rather than just the time spent entering marks in Canvas. A student is logged as marked when you move to the next student on the list.  You can download an unfeasible amount of logging info to read at bedtime if you want to.
https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-eta.user.js

## Benchmarker
If you have ever wanted to do a quick pass through of student submissions and roughly group them in terms of HD or Pass etc - Benchmarker has you covered. I sometimes miss my old analogue system of quickly sorting visually-based assignments in piles on the floor and then marking them in batches according to grade band. This panel replicates that - flick through the tutorial group and assign a grade band and then use Benchmarker’s list function to jump directly to that grouped list of students. Now you can mark all your HDs at once!
https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-benchmarker.user.js

## Rubric Builder
Reusable rubric criteria as a clickable resource. Appears on the Rubric page of Canvas (look for a floating AH panel).  Open from AH panel and assemble your rubric, assign a weight and export in the format Canvas is expecting for bulk import. Never construct criterion one at a time again!
https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-rubric-builder.user.js
