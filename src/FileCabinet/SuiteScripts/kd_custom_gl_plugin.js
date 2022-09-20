var SRCH_ITEM_INTERCO_ACCOUNT = 'customsearch_kd_noninv_item_interco_acct';
var SRCH_INTERCO_SO = 'customsearch_kd_interco_so';
var FLD_CUSTOMER_IS_INTERCO = 'custentity_kd_is_intercompany';
var FLD_LINE_LINK_SO = 'custcol_kd_linking_salesorder';
var CSEG_JOB_NUMBER = 'cseg_job_number';
var REC_JOBNUMBER = 'customrecord_cseg_project_number';
var JOBNUMBER_FLD_SO = 'custrecord4';
var nonInvItems = [];
var itemAmounts = {};
var itemAccounts = {};
var linkedSoIds = [];

function getItemAccounts(items){
    var itemSearch = nlapiLoadSearch('item', SRCH_ITEM_INTERCO_ACCOUNT);
    itemSearch.addFilter(new nlobjSearchFilter('internalid', null, 'anyof', items));
    var searchRs = itemSearch.runSearch();
    searchRs.forEachResult(function(searchResult){
        if(!itemAccounts.hasOwnProperty(searchResult.getValue('internalid'))){
            itemAccounts[searchResult.getValue('internalid')] = {
                income: searchResult.getValue('incomeaccount'),
                expense: searchResult.getValue('expenseaccount'),
                asset: searchResult.getValue('assetaccount'),
                intercompany_income: searchResult.getValue('custitem_kd_interco_reroute_acct'),
                intercompany_expense: searchResult.getValue('custitem_kd_interco_expense_acct'),
                generateaccruals: searchResult.getValue('generateaccruals'),
                description: searchResult.getValue('salesdescription')
            };
        }
        return true;
    });

    nlapiLogExecution('DEBUG', 'getItemAccounts', 'itemAccounts: ' + JSON.stringify(itemAccounts));
    return itemAccounts;
}
function isIntercompanyTransaction(tranRec){
    var isInterco = 'F';
    var recType = tranRec.getRecordType();
    if(recType == 'vendorbill' && tranRec.getFieldValue(CSEG_JOB_NUMBER) != null && tranRec.getFieldValue(CSEG_JOB_NUMBER) != ''){
        var soId = nlapiLookupField(REC_JOBNUMBER, tranRec.getFieldValue(CSEG_JOB_NUMBER), JOBNUMBER_FLD_SO);
        var soCustomer = nlapiLookupField('salesorder', soId, 'entity');
        isInterco = nlapiLookupField('customer', soCustomer, FLD_CUSTOMER_IS_INTERCO);
    }else if(recType == 'itemreceipt'){
        var createdFrom = tranRec.getFieldValue('createdfrom');
        nlapiLogExecution('DEBUG', 'itemreceipt', 'createdfrom: ' + createdFrom);
        if(createdFrom != null && createdFrom != ''){
            var jobNum = nlapiLookupField('purchaseorder', createdFrom, CSEG_JOB_NUMBER);
            nlapiLogExecution('DEBUG', 'itemreceipt', 'jobnum: ' + jobNum);
            if(jobNum != null && jobNum != ''){
                var soId = nlapiLookupField(REC_JOBNUMBER, jobNum, JOBNUMBER_FLD_SO); nlapiLogExecution('DEBUG', 'itemreceipt', 'soId: ' + soId);
                var soCustomer = nlapiLookupField('salesorder', soId, 'entity');
                isInterco = nlapiLookupField('customer', soCustomer, FLD_CUSTOMER_IS_INTERCO);
            }
        }
    }else{
        isInterco = nlapiLookupField('customer', tranRec.getFieldValue('entity'), FLD_CUSTOMER_IS_INTERCO);
    }
    return isInterco;
}
function getItemsAndAmounts(transactionRecord){
    var item, amount, location, sellingLocation, jobNumber;
    for(var i = 1; i <= transactionRecord.getLineItemCount('item'); i++){
        if(transactionRecord.getLineItemValue('item', 'itemtype', i).toUpperCase() == 'NONINVTPART'){
            nonInvItems.push(transactionRecord.getLineItemValue('item', 'item', i));
            item = transactionRecord.getLineItemValue('item', 'item', i);
            amount = transactionRecord.getLineItemValue('item', 'amount', i);
            location = transactionRecord.getLineItemValue('item', 'location', i);
            sellingLocation = transactionRecord.getLineItemValue('item', 'cseg_sell_location', i);
            //jobNumber = transactionRecord.getLineItemValue('item', 'cseg_sell_location', i);

            if(itemAmounts[item] == null){
                itemAmounts[item] = {};
                itemAmounts[item][location] = {};
                itemAmounts[item][location][sellingLocation] = amount;
                //itemAmounts[item] = amount;
            }else{
                if(itemAmounts[item].hasOwnProperty(location)){
                    if(itemAmounts[item][location].hasOwnProperty(sellingLocation)){
                        itemAmounts[item][location][sellingLocation] =  parseFloat(itemAmounts[item][location][sellingLocation]) + parseFloat(amount);
                    }else{
                        itemAmounts[item][location] = {};
                        itemAmounts[item][location][sellingLocation] = amount;
                    }
                }else{
                    itemAmounts[item][location] = {};
                    itemAmounts[item][location][sellingLocation] = amount;
                    //itemAmounts[item][location] = amount;
                }
                //itemAmounts[item] = parseFloat(itemAmounts[item]) + parseFloat(amount);
            }
        }
    }
    nlapiLogExecution('DEBUG', 'getItemsAndAmounts', 'nonInvItems: ' + JSON.stringify(nonInvItems));
    nlapiLogExecution('DEBUG', 'getItemsAndAmounts', 'itemAmounts: ' + JSON.stringify(itemAmounts));
}
function getItemsAndAmountsOLD(transactionRecord){
    var item, amount;
    for(var i = 1; i <= transactionRecord.getLineItemCount('item'); i++){
        if(transactionRecord.getLineItemValue('item', 'itemtype', i).toUpperCase() == 'NONINVTPART'){
            nonInvItems.push(transactionRecord.getLineItemValue('item', 'item', i));
            item = transactionRecord.getLineItemValue('item', 'item', i);
            amount = transactionRecord.getLineItemValue('item', 'amount', i)

            if(itemAmounts[item] == null){
                itemAmounts[item] = amount;
            }else{
                itemAmounts[item] = parseFloat(itemAmounts[item]) + parseFloat(amount);
            }
        }
    }
    nlapiLogExecution('DEBUG', 'getItemsAndAmounts', 'nonInvItems: ' + JSON.stringify(nonInvItems));
    nlapiLogExecution('DEBUG', 'getItemsAndAmounts', 'itemAmounts: ' + JSON.stringify(itemAmounts));
}
function getItemAmounts(transactionRecord, recType, intercoSalesOrders){
    var linkedSo, item, amount, location, sellingLocation, jobNumber;
    for(var i = 1; i <= transactionRecord.getLineItemCount('item'); i++){
        amount = 0;
        linkedSo = transactionRecord.getLineItemValue('item', FLD_LINE_LINK_SO, i);
        if(transactionRecord.getLineItemValue('item', 'itemtype', i).toUpperCase() == 'NONINVTPART' && linkedSo != '' && intercoSalesOrders.indexOf(linkedSo) >= 0){
            nlapiLogExecution('debug', 'getItemAmounts', 'Adding line to amounts ' + i);
            item = transactionRecord.getLineItemValue('item', 'item', i);
            location = transactionRecord.getLineItemValue('item', 'location', i);
            sellingLocation = transactionRecord.getLineItemValue('item', 'cseg_sell_location', i);
            jobNumber = transactionRecord.getLineItemValue('item', 'cseg_job_number', i);
            if(recType == 'itemreceipt' && transactionRecord.getLineItemValue('item', 'generateaccruals', i) == 'T'){
                amount = transactionRecord.getLineItemValue('item', 'itemfxamount', i);
            }else{
                //if(transactionRecord.getFieldValue('createdfrom') != null && transactionRecord.getFieldValue('createdfrom') != '' && itemAccounts[item].generateaccruals == 'T')
                if(transactionRecord.getFieldValue('createdfrom') != null && transactionRecord.getLineItemCount('purchaseorders') > 0 && itemAccounts[item].generateaccruals == 'T')
                    continue;
                //if(itemAccounts[item].generateaccruals == 'F'){
                amount = transactionRecord.getLineItemValue('item', 'amount', i);
                //}
            }

            if(parseFloat(amount) > 0){
                if(itemAmounts[item] == null){
                    itemAmounts[item] = {};
                    itemAmounts[item][location] = {};
                    itemAmounts[item][location][sellingLocation] = {};
                    itemAmounts[item][location][sellingLocation][jobNumber] = amount;
                }else{
                    if(itemAmounts[item].hasOwnProperty(location)){
                        if(itemAmounts[item][location].hasOwnProperty(sellingLocation)){
                            if(itemAmounts[item][location][sellingLocation].hasOwnProperty(jobNumber)){
                                itemAmounts[item][location][sellingLocation][jobNumber] = parseFloat(itemAmounts[item][location][sellingLocation][jobNumber]) + parseFloat(amount);
                            }else{
                                itemAmounts[item][location][sellingLocation][jobNumber] = parseFloat(amount);
                            }
                        }else{
                            itemAmounts[item][location][sellingLocation] = {};
                            itemAmounts[item][location][sellingLocation][jobNumber] = parseFloat(amount);
                        }
                        itemAmounts[item][location] =  parseFloat(itemAmounts[item][location]) + parseFloat(amount);
                    }else{
                        itemAmounts[item][location] = {};
                        itemAmounts[item][location][sellingLocation] = {};
                        itemAmounts[item][location][sellingLocation][jobNumber] = parseFloat(amount);
                    }
                }
            }
        }
    }
}
function getItemAmountsOLD(transactionRecord, recType, intercoSalesOrders){
    var linkedSo, item, amount;
    for(var i = 1; i <= transactionRecord.getLineItemCount('item'); i++){
        linkedSo = transactionRecord.getLineItemValue('item', FLD_LINE_LINK_SO, i);
        if(transactionRecord.getLineItemValue('item', 'itemtype', i).toUpperCase() == 'NONINVTPART' && linkedSo != '' && intercoSalesOrders.indexOf(linkedSo) >= 0){
            nlapiLogExecution('debug', 'getItemAmounts', 'Adding line to amounts ' + i);
            item = transactionRecord.getLineItemValue('item', 'item', i);
            if(recType == 'itemreceipt' && transactionRecord.getLineItemValue('item', 'generateaccruals', i) == 'T'){
                amount = transactionRecord.getLineItemValue('item', 'itemfxamount', i);
                if(itemAmounts[item] == null){
                    itemAmounts[item] = amount;
                }else{
                    itemAmounts[item] = parseFloat(itemAmounts[item]) + parseFloat(amount);
                }
            }else{
                //if(transactionRecord.getFieldValue('createdfrom') != null && transactionRecord.getFieldValue('createdfrom') != '' && itemAccounts[item].generateaccruals == 'T')
                if(transactionRecord.getFieldValue('createdfrom') != null && transactionRecord.getLineItemCount('purchaseorders') > 0 && itemAccounts[item].generateaccruals == 'T')
                    continue;
                //if(itemAccounts[item].generateaccruals == 'F'){
                amount = transactionRecord.getLineItemValue('item', 'amount', i)
                if(itemAmounts[item] == null){
                    itemAmounts[item] = amount;
                }else{
                    itemAmounts[item] = parseFloat(itemAmounts[item]) + parseFloat(amount);
                }
                //}
            }
        }
    }
}
function getItemsAndLinkedSo(transactionRecord){
    var linkedSo;
    for(var i = 1; i <= transactionRecord.getLineItemCount('item'); i++){
        linkedSo = transactionRecord.getLineItemValue('item', FLD_LINE_LINK_SO, i);
        nlapiLogExecution('debug', 'getItemsAndLinkedSo', i + ' linked SO ' + linkedSo);
        if(transactionRecord.getLineItemValue('item', 'itemtype', i).toUpperCase() == 'NONINVTPART' && linkedSo != ''){
            if(nonInvItems.indexOf(transactionRecord.getLineItemValue('item', 'item', i))){
                nonInvItems.push(transactionRecord.getLineItemValue('item', 'item', i));
            }
            if(linkedSoIds.indexOf(linkedSo) < 0){
                linkedSoIds.push(linkedSo);
            }
        }
    }
}
function getIntercompanySalesOrders(linkedSoIds){
    var soSearch = nlapiLoadSearch('', SRCH_INTERCO_SO);
    soSearch.addFilter(new nlobjSearchFilter('internalid', null, 'anyof', linkedSoIds));
    var searchRs = soSearch.runSearch();
    var intercoSalesOrders = [];
    searchRs.forEachResult(function(searchResult){
        nlapiLogExecution('DEBUG', 'getIntercompanySalesOrders', 'searchRS: ' + searchResult.getValue('internalid'));
        if(intercoSalesOrders.indexOf(searchResult.getValue('internalid')) < 0){
            intercoSalesOrders.push(searchResult.getValue('internalid'));
        }
        return true;
    });
    nlapiLogExecution('debug', 'getIntercompanySalesOrders', 'intercoSalesOrders: ' + JSON.stringify(intercoSalesOrders));
    return intercoSalesOrders;
}
function addGlLines(itemAmounts, recType, transactionRecord, customLines){
    for(var item in itemAmounts){
        for(var location in itemAmounts[item]){
            for(var sellingLocation in itemAmounts[item][location]){
                amount = itemAmounts[item][location][sellingLocation];
                if(parseFloat(amount) > 0){
                    if((recType == 'invoice' || recType == 'salesorder') && itemAccounts[item].intercompany_income != ""){
                        debitAcct = parseInt(itemAccounts[item].income);
                        creditAcct = parseInt(itemAccounts[item].intercompany_income);
                    }else if(recType == 'creditmemo' && itemAccounts[item].intercompany_income != ""){
                        debitAcct = parseInt(itemAccounts[item].intercompany_income);
                        creditAcct = parseInt(itemAccounts[item].income);
                    }else{
                        if(recType == 'itemreceipt' && itemAccounts[item].generateaccruals != 'T')
                            continue;

                        if(recType == 'vendorbill' && transactionRecord.getLineItemCount('purchaseorders') > 0 && itemAccounts[item].generateaccruals == 'T')
                            continue;

                        if(itemAccounts[item].intercompany_expense == "")
                            continue;

                        debitAcct = parseInt(itemAccounts[item].intercompany_expense)
                        creditAcct = parseInt(itemAccounts[item].expense)
                    }
                    /*if(sellingLocation != null && sellingLocation != ''){
                        sellingLocation = parseInt(sellingLocation);
                    }else{
                        sellingLocation = '';
                    }*/
                    try{
                        var newLine = customLines.addNewLine();
                        newLine.setDebitAmount(amount);
                        newLine.setAccountId(debitAcct);
                        newLine.setMemo(itemAccounts[item].description);
                        newLine.setLocationId(parseInt(location));
                        //                if(sellingLocation != null && sellingLocation != '')
                        //               newLine.setSegmentValueId('cseg_sell_location', sellingLocation);

                        newLine = customLines.addNewLine();
                        newLine.setCreditAmount(amount);
                        newLine.setAccountId(creditAcct);
                        newLine.setMemo(itemAccounts[item].description);
                        newLine.setLocationId(parseInt(location));
                        nlapiLogExecution('DEBUG', 'customGLLines', 'added custom gl line');
                        if(sellingLocation != null && sellingLocation != '')
                            newLine.setSegmentValueId('cseg_sell_location', sellingLocation);//cseg_job_number
                    }catch(ex){
                        nlapiLogExecution('DEBUG', 'addGlLines ERR', ex.toString());
                    }
                }
            }
        }
    }
}
function addGlLinesWithJobNumber(itemAmounts, recType, transactionRecord, customLines){
    for(var item in itemAmounts){
        for(var location in itemAmounts[item]){
            for(var sellingLocation in itemAmounts[item][location]){
                for(var jobNumber in itemAmounts[item][location][sellingLocation]){
                    amount = itemAmounts[item][location][sellingLocation][jobNumber];
                    nlapiLogExecution('debug', 'addGlLinesWithJobNumber', 'amount ' + amount);
                    if(parseFloat(amount) > 0){
                        if((recType == 'invoice' || recType == 'salesorder') && itemAccounts[item].intercompany_income != ""){
                            debitAcct = parseInt(itemAccounts[item].income);
                            creditAcct = parseInt(itemAccounts[item].intercompany_income);
                        }else if(recType == 'creditmemo' && itemAccounts[item].intercompany_income != ""){
                            debitAcct = parseInt(itemAccounts[item].intercompany_income);
                            creditAcct = parseInt(itemAccounts[item].income);
                        }else{
                            if(recType == 'itemreceipt' && itemAccounts[item].generateaccruals != 'T')
                                continue;

                            if(recType == 'vendorbill' && transactionRecord.getLineItemCount('purchaseorders') > 0 && itemAccounts[item].generateaccruals == 'T')
                                continue;
                            nlapiLogExecution('debug', 'addGlLinesWithJobNumber', 'went here');
                            if(itemAccounts[item].intercompany_expense == "")
                                continue;
                            nlapiLogExecution('debug', 'addGlLinesWithJobNumber', 'went here 2');

                            debitAcct = parseInt(itemAccounts[item].intercompany_expense)
                            creditAcct = parseInt(itemAccounts[item].expense)
                        }
                        /*if(sellingLocation != null && sellingLocation != ''){
                            sellingLocation = parseInt(sellingLocation);
                        }else{
                            sellingLocation = '';
                        }*/

                        nlapiLogExecution('debug', 'addGlLinesWithJobNumber', 'debitAcct ' + debitAcct);
                        nlapiLogExecution('debug', 'addGlLinesWithJobNumber', 'creditAcct ' + creditAcct);
                        nlapiLogExecution('debug', 'addGlLinesWithJobNumber', 'jobNumber ' + jobNumber);

                        try{
                            var newLine = customLines.addNewLine();
                            newLine.setDebitAmount(amount);
                            newLine.setAccountId(debitAcct);
                            newLine.setMemo(itemAccounts[item].description);
                            newLine.setLocationId(parseInt(location));
                            if(sellingLocation != null && sellingLocation != '')
                                newLine.setSegmentValueId('cseg_sell_location', parseInt(sellingLocation));
                            newLine.setSegmentValueId('cseg_job_number', parseInt(jobNumber));

                            newLine = customLines.addNewLine();
                            newLine.setCreditAmount(amount);
                            newLine.setAccountId(creditAcct);
                            newLine.setMemo(itemAccounts[item].description);
                            newLine.setLocationId(parseInt(location));
                            nlapiLogExecution('DEBUG', 'customGLLines', 'added custom gl line');
                            if(sellingLocation != null && sellingLocation != '')
                                newLine.setSegmentValueId('cseg_sell_location', parseInt(sellingLocation));//cseg_job_number
                            newLine.setSegmentValueId('cseg_job_number', parseInt(jobNumber));
                        }catch(ex){
                            nlapiLogExecution('DEBUG', 'addGlLines ERR', ex.toString());
                        }
                    }
                }
            }
        }
    }
}
function customizeGlImpact(transactionRecord, standardLines, customLines, book)
{
    nlapiLogExecution('DEBUG', 'execution context', nlapiGetContext().getExecutionContext());
    if(nlapiGetContext().getExecutionContext() == 'webservices' || nlapiGetContext().getExecutionContext() == 'webapplication' || nlapiGetContext().getExecutionContext() == 'webstore')
        return;

    var recType = transactionRecord.getRecordType();

    if(recType == 'invoice' || recType == 'creditmemo' || recType == 'salesorder'){
        var isInterco = isIntercompanyTransaction(transactionRecord);
        nlapiLogExecution('DEBUG', 'customizeGlImpact', 'isInterco: ' + isInterco + '; tranType: ' + transactionRecord.getRecordType());
        if(isInterco == 'T'){
            getItemsAndAmounts(transactionRecord);
            if(nonInvItems.length > 0){
                getItemAccounts(nonInvItems);
            }
        }
    }else{
        getItemsAndLinkedSo(transactionRecord);
        if(nonInvItems.length > 0){
            getItemAccounts(nonInvItems);
            var intercoSalesOrders = getIntercompanySalesOrders(linkedSoIds);
            getItemAmounts(transactionRecord, recType, intercoSalesOrders);
        }
    }

    var amount, debitAcct, creditAcct;nlapiLogExecution('debug', 'customizeGlImpact', 'itemAmounts: ' + JSON.stringify(itemAmounts));
    if(recType == 'invoice' || recType == 'creditmemo' || recType == 'salesorder'){
        addGlLines(itemAmounts, recType, transactionRecord, customLines);
    }else{
        addGlLinesWithJobNumber(itemAmounts, recType, transactionRecord, customLines);
    }
    /*for(var item in itemAmounts){
        amount = itemAmounts[item];
        if(recType == 'invoice' && itemAccounts[item].intercompany_income != ""){
            debitAcct = parseInt(itemAccounts[item].income);
            creditAcct = parseInt(itemAccounts[item].intercompany_income);
        }else if(recType == 'creditmemo' && itemAccounts[item].intercompany_income != ""){
            debitAcct = parseInt(itemAccounts[item].intercompany_income);
            creditAcct = parseInt(itemAccounts[item].income);
        }else{
            if(recType == 'itemreceipt' && itemAccounts[item].generateaccruals != 'T')
                continue;

            if(recType == 'vendorbill' && transactionRecord.getLineItemCount('purchaseorders') > 0 && itemAccounts[item].generateaccruals == 'T')
                continue;

            if(itemAccounts[item].intercompany_expense == "")
                continue;

            debitAcct = parseInt(itemAccounts[item].intercompany_expense)
            creditAcct = parseInt(itemAccounts[item].expense)
        }

        var newLine = customLines.addNewLine();
        newLine.setDebitAmount(amount);
        newLine.setAccountId(debitAcct);
        newLine.setMemo("custom");
        newLine.setLocationId(203);

        newLine = customLines.addNewLine();
        newLine.setCreditAmount(amount);
        newLine.setAccountId(creditAcct);
        newLine.setMemo("custom");
        newLine.setLocationId(203);
        nlapiLogExecution('DEBUG', 'customGLLines', 'added custom gl line');
    }*/
}