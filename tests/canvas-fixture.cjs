async function seedStorage(page) {
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('assessmentHelpers:tutorialSorter:v1:groups', JSON.stringify({
      courses: {
        VCDE1000: {
          activeClassKey: 'studio-a',
          classes: {
            'studio-a': {
              id: 'studio-a',
              classKey: 'studio-a',
              label: 'Studio A',
              name: 'Studio A',
              courseCode: 'VCDE1000',
              students: [
                { name: 'Jane Citizen', canvas_name: 'Jane Citizen', user_id: '1' },
                { name: 'Max Example', canvas_name: 'Max Example', user_id: '2' }
              ]
            }
          }
        }
      }
    }));
    localStorage.setItem('assessmentHelpers:tutorialSorter:v1:activeGroup', 'studio-a');
    localStorage.setItem('vcGradeBridge:pairs:v1', JSON.stringify({
      42: {
        100: {
          targetAssignmentId: '200',
          targetAssignmentName: 'Project 02',
          sourceAssignmentName: 'Project 01'
        },
        200: {
          targetAssignmentId: '100',
          targetAssignmentName: 'Project 01',
          sourceAssignmentName: 'Project 02'
        }
      }
    }));
  });
}


module.exports = { seedStorage };
