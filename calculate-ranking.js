//::::::::::::::::::::::  DOCUMENT READY STARTS ::::::::::::::::::::::
$(document).ready(function () {
    console.log('calculate-ranking.js is connected');

});

// when user selects a month in the dropdown menu
var $monthDropdown = $('#months-dd');

// Any info message shows here
var $infoMSG = $('#info-msg');

var $reportSection = $('#report-section')


const tableMatrix = `<table style='font-family: Arial, Helvetica, sans-serif;
    border: 1px solid;
    border-collapse: collapse;
    width: 100%;
    padding-top: 12px;
    padding-left: 12px;
    padding-bottom: 12px;
    text-align: left;'>
    <tr style='padding-left: 12px; color: white; background-color: #80AAFF; border: 1px solid black'>
    <th style='padding-top: 12px; padding-bottom: 12px; padding-left: 12px'>Position</th>
    <th>Name</th>
    <th>Fish</th>
    <th>Fishery Name</th>
    <th>WeightLB</th>

</tr>`;

// $monthDropdown.change(function () {
//     selectedMonth = $('#months-dd option:selected').text();
//     alert(selectedMonth);
// });

// Troutmasters site URL
siteUrl = 'https://bauer.sharepoint.com/sites/UK-Publishing-Troutmasters/';

// current context of the app
var clientContext = new SP.ClientContext(siteUrl);


function checkDropdown(selectedMonth, selectedList) {
    if (selectedMonth.includes('Choose')) {
        alert('Please select a month');
    }
    if (selectedList.includes('Choose')) {
        alert('Please select a database');

    } else {
        // do nothing
    }

}

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// ::::::::::::::::::::::::::::::::::::::::::::::: CALCULATE AND UPDATE RANKS ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// When user clicks any of the "Calculate Ranks" button, it sets the RANK field in the relevant Anglers list ::::::::::
function calculateRanks() {

    // Get the month
    var selectedMonth = $('#months-dd option:selected').val();

    // Get list
    var SPList = $('#database-dd option:selected').val();

    var oList = clientContext.get_web().get_lists().getByTitle(SPList);

    checkDropdown(selectedMonth, SPList);

    var camlQuery = new SP.CamlQuery();

    // set caml query
    camlQuery.set_viewXml("<View><Query><Where><Eq><FieldRef Name='Month'/><Value Type='Number'>" + selectedMonth + "</Value></Eq></Where><GroupBy><FieldRef Name='Fishery_x0020_Name' /></GroupBy><OrderBy><FieldRef Name='WeightLB' Ascending='FALSE'/></OrderBy></Query></View>");

    console.log('camlQuery : ', camlQuery);

    collListItem = oList.getItems(camlQuery);

    clientContext.load(collListItem);

    clientContext.executeQueryAsync(onCalcRankSucceeded, onCalcRankFailed);


}

// :::::::::: if calculateRanks succeeds sets the ranks and call the update item function ::::::::::
function onCalcRankSucceeded(sender, args) {

    //how many items retrieved?
    var count = collListItem.get_count();

    // set the INFO or ERROR message
    if (count <= 0) {
        $infoMSG.text('no results found');
        return false;
    } else {
        $infoMSG.text(count + 'results found.')
    }

    var listItemInfo = '';
    // Rank variable to set the field Rank for each itemS
    var rank = 0;

    // to sort out by fisheries
    var currFishery;
    var prevFishery;

    var listItemEnumerator = collListItem.getEnumerator();

    while (listItemEnumerator.moveNext()) {
        var oListItem = listItemEnumerator.get_current();

        try {
            var currFishery = oListItem.get_item('Fishery_x0020_Name').get_lookupValue(); // lookup field

        } catch (error) {
            console.log(`Fishery name is blank`);
        }

        var fisherman = oListItem.get_item('Title');
        var weightLB = oListItem.get_item('WeightLB');

        // if prevFishery is undefined, set its value to currFishery (this is to set a value for the first time so it won't set the rank to 0 when the query first runs)
        if (prevFishery === undefined) {
            console.log('preFishery is undefined!!!');
            var placeholderVal = currFishery;
            prevFishery = placeholderVal;
        } else {};


        // If the current item's fishery name is the same as the previous item's fishery name
        if (currFishery === prevFishery) {
            console.log('Fishery is the same', currFishery, prevFishery);
            //increase the rank number
            rank++;
        } else {
            rank = 1;
            console.log('fishery has changed => reset the rank to: ', rank);
        }

        listItemInfo += '\nFisherman: ' + fisherman +
            '\nFishery: ' + currFishery +
            '\nFish weight: ' + weightLB +
            '\nRank: ' + rank;


        // update the item's rank - in the "Rank" field
        oListItem.set_item("RankTest", rank);
        oListItem.update();
        clientContext.executeQueryAsync(onUpdateSucceeded, onUpdateFailed);

        // console.log('current record is', listItemInfo);

        // set previous fishery with the name of the current one to keep track
        prevFishery = currFishery;

    }

    console.log(listItemInfo.toString());

}

// If update item's rank succeeded ✅
function onUpdateSucceeded() {
    $infoMSG.text("Ranks updated");
    //clear the message
    setTimeout(function () {
        $infoMSG.empty();
    }, 5000)
}

// If update item's rank failed ❌
function onUpdateFailed(sender, args) {
    console.log('Could not update the rank :(( failed. ' + args.get_message() + '\n' + args.get_stackTrace());
}

// :::::::::: if calculateRanks fails ❌::::::::::
function onCalcRankFailed(sender, args) {
    console.log('Calculate rank failed. ' + args.get_message() + '\n' + args.get_stackTrace());
}



// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// ::::::::::::::::::::::::::::::::::::::::::::::: GET WINNERS ALL FISHERIES :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// 🐟 CAML query get the 3 best fishermen 
function getWinnersAF() {

    // Get the month
    var selectedMonth = $('#months-dd option:selected').val();

    // Get list
    var SPList = $('#database-dd option:selected').val();

    var oList = clientContext.get_web().get_lists().getByTitle(SPList);

    checkDropdown(selectedMonth, SPList);

    var camlQuery = new SP.CamlQuery();

    // Get the 3 heaviest fish caught 
    camlQuery.set_viewXml(`<View><Query><Where><Eq><FieldRef Name='Month'/><Value Type='Number'> ${selectedMonth} </Value></Eq></Where><OrderBy><FieldRef Name='WeightLB' Ascending='FALSE'/></OrderBy></Query><RowLimit>3</RowLimit></View>`);

    console.log('camlQuery : ', camlQuery);

    collListItem2 = oList.getItems(camlQuery);

    clientContext.load(collListItem2);

    clientContext.executeQueryAsync(ongetWinnersAFSucceeded, onGetWinnersAFFAILED);

}

// If getWinnersAF function succeeds ✅
function ongetWinnersAFSucceeded(sender, args) {
    var rankList = `<h2> Top 3 all fisheries</h2>`;
    rankList += tableMatrix;

    var position = 0; // position from 1 to 3

    var listItemEnumerator = collListItem2.getEnumerator();

    while (listItemEnumerator.moveNext()) {
        var oListItem = listItemEnumerator.get_current();


        var anglersName = oListItem.get_item('Title');
        var fish = oListItem.get_item('Fish');
        try {
            var fisheryName = oListItem.get_item('Fishery_x0020_Name').get_lookupValue();
        } catch (error) {
            alert('please make sure that there is no blank field in the Fishery Name column')

        }

        var weightLB = oListItem.get_item('WeightLB');

        position++;

        rankList += `
                        <tr style='padding-top: 12px; padding-bottom: 12px'>
                        <td style='padding-top: 12px; padding-bottom: 12px'>${position}</td>
                        <td>${anglersName} </td>
                        <td>${fish}</td>
                        <td>${fisheryName}</td>
                        <td>${weightLB}</td>
                    </tr>
                    <tr>

                    `;
    }

    rankList += `</table>`;

    $reportSection.html(rankList);

}

// If getWinnersAF function fails ❌
function onGetWinnersAFFAILED(sender, args) {
    console.log('Could not get the winners. Failed. :( ' + args.get_message() + '\n' + args.get_stackTrace());
}


// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// ::::::::::::::::::::::::::::::::::::::::::::::: GET WINNER PER FISHERY ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// GET WINNER PER FISHERY - where rank is 1, 2, 3
function getWinnersPF() {

    // Get the month
    var selectedMonth = $('#months-dd option:selected').val();

    // Get list
    var SPList = $('#database-dd option:selected').val();

    var oList = clientContext.get_web().get_lists().getByTitle(SPList);

    checkDropdown(selectedMonth, SPList);

    var oList = clientContext.get_web().get_lists().getByTitle(SPList);
    var camlQuery = new SP.CamlQuery();

    // camlQuery.set_viewXml(
    //     `<View><Query><Where><And><Eq><FieldRef Name='Month' /><Value Type='Number'>${selectedMonth}</Value></Eq><Or><Eq><FieldRef Name='RankTest' /><Value Type='Number'>1</Value></Eq><Or><Eq><FieldRef Name='RankTest' /><Value Type='Number'>2</Value></Eq><Eq><FieldRef Name='RankTest'/><Value Type='Number'>3</Value></Eq></Or></Or></And></Where><GroupBy><FieldRef Name='Fishery_x0020_Name' /></GroupBy><OrdedrBy><FieldRef Name='RankTest' Ascending='TRUE'/></OrderBy></Query></View>`
    // );

    camlQuery.set_viewXml(
        `<View><Query><Where><And><Eq><FieldRef Name='Month' /><Value Type='Number'> ${selectedMonth}</Value></Eq><Or><Eq><FieldRef Name='RankTest' /><Value Type='Number'>1</Value></Eq><Or><Eq><FieldRef Name='RankTest' /><Value Type='Number'>2</Value></Eq><Eq><FieldRef Name='RankTest'/><Value Type='Number'>3</Value></Eq></Or></Or></And></Where><OrderBy><FieldRef Name='Fishery_x0020_Name' /><FieldRef Name='RankTest' Ascending='TRUE'/></OrderBy></Query></View>`
    );



    console.log('CAML QUERY PER FISHERY : ', camlQuery);

    collListItem3 = oList.getItems(camlQuery);

    clientContext.load(collListItem3);

    clientContext.executeQueryAsync(onGetWinnersPFSucceeded, onGetWinnersPFFAILED);

}

// If getWinnersPF function succeeds ✅
function onGetWinnersPFSucceeded(sender, args) {

    //how many items retrieved?
    var count = collListItem3.get_count();

    // set the INFO or ERROR message
    if (count <= 0) {
        $infoMSG.text('Please make sure the ranks have been calculated. Press "Calculate Rank');
        return false;
    } else {

        var rankListPF = `<h2> Ranking per fishery</h2>`;

        rankListPF += tableMatrix;

        var listItemEnumerator = collListItem3.getEnumerator();

        while (listItemEnumerator.moveNext()) {
            var oListItem = listItemEnumerator.get_current();
            // get the ID number


            var anglersName = oListItem.get_item('Title');
            var fish = oListItem.get_item('Fish');
            try {
                var fisheryName = oListItem.get_item('Fishery_x0020_Name').get_lookupValue();

            } catch (error) {
                console.log(` the record Fishery Name field is blank`);
            }
            var weightLB = oListItem.get_item('WeightLB');
            var rank = oListItem.get_item('RankTest');

            rankListPF += `
                        <tr style='padding-top: 12px; padding-bottom: 12px'>
                        <td style='padding-top: 12px; padding-bottom: 12px; padding-left: 12px'>${rank}</td>
                        <td>${anglersName} </td>
                        <td>${fish}</td>
                        <td>${fisheryName}</td>
                        <td>${weightLB}</td>
                    </tr>
                    <tr>

                    `;
        }

        $reportSection.html(rankListPF);
    }


}

// If getWinnersPF fails ❌
function onGetWinnersPFFAILED(sender, args) {
    console.log('Could not get the winners per fishery. Failed. :( ' + args.get_message() + '\n' + args.get_stackTrace());
}