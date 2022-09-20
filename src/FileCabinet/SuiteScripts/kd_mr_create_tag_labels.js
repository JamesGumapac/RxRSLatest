/**
*@NApiVersion 2.x
*@NScriptType MapReduceScript
*/
define(['N/runtime', 'N/search', 'N/record', 'N/task', 'N/file', 'N/format'],
function(runtime, search, record, task, file, format){
    var SCR_PARAM_DESTRUCTION_BIN = 'custscript_kd_destruction_bin';
    var SCR_PARAM_HAZARDOUS_BIN = 'custscript_kd_hazardous_bin';
    var SEA_RR = 'customsearch_kd_mr_rr_sublist';
    var REC_RET_REQ = 'customsale_kod_returnrequest';
    var FLD_RR_FOR_TAG_LABEL_GEN = 'custbody_kd_rr_for_tag_label_gen';
    var FLD_RR_MFG_PROCESSING = 'custcol_kod_mfgprocessing';
    var REC_MANUF = 'customrecord_csegmanufacturer';
    var FLD_MANUF_SO_MAX = 'custrecord_kd_mfgmaxvaljue';
    var FLD_RR_IT_HAZARDOUS = 'custcol_kd_hazmat_line';
    var FLD_RR_IT_MANUF = 'custcol_kd_item_manufacturer';
    var FLD_RR_IT_INDATE_FLAG = 'custcol_kd_indate_flag';
    var FLD_RR_IT_INDATE = 'custcol_kd_indate';
    var SEA_MANUF = 'customsearch_kd_manufacturer';
    var SEA_BIN_QTY = 'customsearch_kd_bin_qty'
    var SEA_BINS = 'customsearch_kd_bins';
    var FLD_RR_MRR = 'custbody_kd_master_return_id';
    var FLD_RR_CUSTOMER = 'entity';
    var FLD_RR_ITEM_TAG = 'custcol_kd_baglabel_link';
    var PROCESSING_NON_RETURNABLE = 1;
    var PROCESSING_RETURNABLE = 2;
    var rBins = [], ridBins = [], dBins = [], hBins = [], npBins = [], binsWithQty = [];
    var rBinNames = {}, ridBinNames = {}, dBinNames = {}, hBinNames = {}, npBinNames = {};
    var rBinsByManuf = {}, ridBinsByManuf = {}, dBinsByManuf = {}, hBinsByManuf = {}, npBinsByManuf = {};
    function getManufMaxSoAmounts(manufs){
        var manufSoMaxAmounts = {};
        if(manufs.length > 0){
            var manufSearch = search.load({
                id: SEA_MANUF
            });
            manufSearch.filters.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: manufs
            }));
            
            var manufRs = manufSearch.run().getRange({start: 0, end: 1000});
            var soMaxAmount, manuf;
            for(var i = 0; i < manufRs.length; i++){
                manuf = manufRs[i].id;
                soMaxAmount = manufRs[i].getValue(FLD_MANUF_SO_MAX);
                manufSoMaxAmounts[manuf] = soMaxAmount;
            }
            log.debug('getManufMaxSoAmounts', JSON.stringify(manufSoMaxAmounts))
        }
        return manufSoMaxAmounts;
    }
    function getBins(){
        var bins = [];
        var binsSearch = search.load({
            id: SEA_BINS
        });        
        var binsSearchRs = binsSearch.run();
        var start = 0;
        var end = 1000;
        var binsSearchResults = binsSearchRs.getRange({start: start, end: end});
        var binNumber;

        while(binsSearchResults.length > 0){
            log.debug('getBins', 'binsSearchResults.length ' + binsSearchResults.length);
            for(var i = 0; i < binsSearchResults.length; i++){
                binNumber = binsSearchResults[i].getValue('binnumber').toUpperCase();
                if(binNumber.startsWith('H')){
                    hBins.push(binsSearchResults[i].id);
                    hBinNames[binsSearchResults[i].id] = binNumber;

                    binManuf = binsSearchResults[i].getValue('custrecord_kd_bin_manufacturer');
                    if(!hBinsByManuf.hasOwnProperty(binManuf)){
                        hBinsByManuf[binManuf] = [];
                    }
                    hBinsByManuf[binManuf].push(binsSearchResults[i].id);
                }else if(binNumber.startsWith('D')){
                    dBins.push(binsSearchResults[i].id);
                    dBinNames[binsSearchResults[i].id] = binNumber;

                    binManuf = binsSearchResults[i].getValue('custrecord_kd_bin_manufacturer');
                    if(!dBinsByManuf.hasOwnProperty(binManuf)){
                        dBinsByManuf[binManuf] = [];
                    }
                    dBinsByManuf[binManuf].push(binsSearchResults[i].id);
                }else if(binNumber.startsWith('R-ID')){
                    ridBins.push(binsSearchResults[i].id);
                    ridBinNames[binsSearchResults[i].id] = binNumber;

                    binManuf = binsSearchResults[i].getValue('custrecord_kd_bin_manufacturer');
                    if(!ridBinsByManuf.hasOwnProperty(binManuf)){
                        ridBinsByManuf[binManuf] = [];
                    }
                    ridBinsByManuf[binManuf].push(binsSearchResults[i].id);
                }else if(binNumber.startsWith('R')){
                    rBins.push(binsSearchResults[i].id);
                    rBinNames[binsSearchResults[i].id] = binNumber;

                    binManuf = binsSearchResults[i].getValue('custrecord_kd_bin_manufacturer');
                    if(!rBinsByManuf.hasOwnProperty(binManuf)){
                        rBinsByManuf[binManuf] = [];
                    }
                    rBinsByManuf[binManuf].push(binsSearchResults[i].id);
                }else if(binNumber.startsWith('NP')){
                    npBins.push(binsSearchResults[i].id);
                    npBinNames[binsSearchResults[i].id] = binNumber;

                    binManuf = binsSearchResults[i].getValue('custrecord_kd_bin_manufacturer');
                    if(!npBinsByManuf.hasOwnProperty(binManuf)){
                        npBinsByManuf[binManuf] = [];
                    }
                    npBinsByManuf[binManuf].push(binsSearchResults[i].id);
                }
                bins.push(binsSearchResults[i].id);
            }

            start += 1000;
            end += 1000;
            binsSearchResults = binsSearchRs.getRange({start: start, end: end});
        }
        //log.debug('getBins', 'hBins: ' + JSON.stringify(hBins));
        //log.debug('getBins', 'dBins: ' + JSON.stringify(dBins));
        //log.debug('getBins', 'rBins: ' + JSON.stringify(rBins));

        var binQtySearch = search.load({
            id: SEA_BIN_QTY
        });
        binQtySearch.filters.push(search.createFilter({
           name: 'internalid',
           join: 'binnumber',
           operator: search.Operator.ANYOF,
           values: bins 
        }));
        var binQtySearchRs = binQtySearch.run();
        start = 0;
        end = 1000;
        var binQtySearchResults = binQtySearchRs.getRange({start: start, end: end});

        log.debug('getBins', 'binQtySearchResults.length ' + binQtySearchResults.length)
        while(binQtySearchResults.length > 0){
            for(var i = 0; i < binQtySearchResults.length; i++){
                binsWithQty.push(binQtySearchResults[i].getValue({
                    name: 'internalid',
                    join: 'binnumber'
                }));
            }

            start += 1000;
            end += 1000;
            binQtySearchResults = binQtySearchRs.getRange({start: start, end: end});
        }

        /*if(hBins.length > 0){
            for(var i = 0; i < hBins.length; i++){
                if(binsWithQty.indexOf(hBins[i]) >= 0){
                    hBins.splice(i, 1);
                }
            }
        }*/

        /*if(hBins.length > 0){
            for(var i = hBins.length-1; i >= 0; i--){
                if(binsWithQty.indexOf(hBins[i]) >= 0){
                    hBins.splice(i, 1);
                }
            }
        }

        if(dBins.length > 0){
            for(var i = dBins.length-1; i >= 0; i--){
                if(binsWithQty.indexOf(dBins[i]) >= 0){
                    dBins.splice(i, 1);
                }
            }
        }*/
        
        for(var binManuf in rBinsByManuf){
            var manufBins = rBinsByManuf[binManuf];
            for(var i = manufBins.length-1; i >= 0; i--){
                if(binsWithQty.indexOf(manufBins[i]) >= 0){
                    manufBins.splice(i, 1);
                }
            }
        }
        for(var binManuf in ridBinsByManuf){
            var manufBins = ridBinsByManuf[binManuf];
            for(var i = manufBins.length-1; i >= 0; i--){
                if(binsWithQty.indexOf(manufBins[i]) >= 0){
                    manufBins.splice(i, 1);
                }
            }
        }
        for(var binManuf in dBinsByManuf){
            var manufBins = dBinsByManuf[binManuf];
            for(var i = manufBins.length-1; i >= 0; i--){
                if(binsWithQty.indexOf(manufBins[i]) >= 0){
                    manufBins.splice(i, 1);
                }
            }
        }
        for(var binManuf in hBinsByManuf){
            var manufBins = hBinsByManuf[binManuf];
            for(var i = manufBins.length-1; i >= 0; i--){
                if(binsWithQty.indexOf(manufBins[i]) >= 0){
                    manufBins.splice(i, 1);
                }
            }
        }
        for(var binManuf in npBinsByManuf){
            var manufBins = npBinsByManuf[binManuf];
            for(var i = manufBins.length-1; i >= 0; i--){
                if(binsWithQty.indexOf(manufBins[i]) >= 0){
                    manufBins.splice(i, 1);
                }
            }
        }
    }
    function createTagLabelRecord(mrr, rr, customer, manufacturer, bin){
        var REC_TAG_LABEL = 'customrecord_kd_taglabel';
        var FLD_TAG_LABEL_MRR = 'custrecord_kd_mrr_link';
        var FLD_TAG_LABEL_RR = 'custrecord_kd_tag_return_request';
        var FLD_TAG_LABEL_MFG = 'custrecord_kd_mfgname';
        var FLD_TAG_LABEL_BIN = 'custrecord_kd_putaway_loc';
        var FLD_TAG_LABEL_CUSTOMER = 'custrecord_kd_tag_customer';
        log.debug('createTagLabelRecord', mrr + '; ' + customer + '; ' + manufacturer + '; ' + bin);
        var tagLabelRec = record.create({
            type: REC_TAG_LABEL,
            isDynamic: true
        });
        
        tagLabelRec.setValue({
            fieldId: FLD_TAG_LABEL_MRR,
            value: mrr,
            ignoreFieldChange: true
        });
        tagLabelRec.setValue({
            fieldId: FLD_TAG_LABEL_RR,
            value: rr,
            ignoreFieldChange: true
        });
        tagLabelRec.setValue({
            fieldId: FLD_TAG_LABEL_CUSTOMER,
            value: customer,
            ignoreFieldChange: true
        });
        tagLabelRec.setValue({
            fieldId: FLD_TAG_LABEL_MFG,
            value: manufacturer,
            ignoreFieldChange: true
        });
        tagLabelRec.setValue({
            fieldId: FLD_TAG_LABEL_BIN,
            value: bin,
            ignoreFieldChange: true
        });
        
        return tagLabelRec.save();
    }
    function groupItemsByManufAndAmount(items, manufSoMaxAmounts){
        var itemsByManufAndAmount = {};
        log.debug('TEST GROUPITEMS', Object.keys(items))
        if(Object.keys(items).length > 0){
            var manufSoMaxAmount, item, manufTagCount, manufTagTotal, isAddedToList;

            for(var manuf in items){
                manufSoMaxAmount = manufSoMaxAmounts[manuf];
                manufTagCount = 0;
                manufTagTotal = [];
                itemsByManufAndAmount[manuf] = [];

                for(var i = 0; i < items[manuf].length; i++){
                    isAddedToList = false;
                    item = items[manuf][i];
                    if(manufSoMaxAmount == ''){
                        if(itemsByManufAndAmount[manuf][manufTagCount] == null){
                            itemsByManufAndAmount[manuf][manufTagCount] = [];
                            manufTagTotal[0] = 0;
                        }
                        itemsByManufAndAmount[manuf][manufTagCount].push({
                            rrLineNo: item.rrLineNo,
                            item: item.item,
                            amount: item.amount
                        });
                        manufTagTotal[0] = parseFloat(manufTagTotal[0]) + parseFloat(item.amount);
                    }else{
                        //create first element if there is no instance on the object yet
                        if(itemsByManufAndAmount[manuf].length == 0){
                            itemsByManufAndAmount[manuf][0] = [];
                            manufTagTotal[0] = 0;
                        }
                        for(var j = 0; j < itemsByManufAndAmount[manuf].length; j++){
                            if((parseFloat(manufTagTotal[j]) + parseFloat(item.amount)) <= manufSoMaxAmount){
                                isAddedToList = true;
                                itemsByManufAndAmount[manuf][j].push({
                                    rrLineNo: item.rrLineNo,
                                    item: item.item,
                                    amount: item.amount
                                });
                                manufTagTotal[j] = parseFloat(manufTagTotal[j]) + parseFloat(item.amount);
                                break;
                            }
                        }
                        if(!isAddedToList){
                            manufTagCount = itemsByManufAndAmount[manuf].length;
                            manufTagTotal.push(item.amount);
                            itemsByManufAndAmount[manuf][manufTagCount] = [];
                            itemsByManufAndAmount[manuf][manufTagCount].push({
                                rrLineNo: item.rrLineNo,
                                item: item.item,
                                amount: item.amount
                            });
                            //manufTagTotal[manufTagCount] = parseFloat(manufTagTotal[manufTagCount]) + parseFloat(returnableItem.amount);
                            log.debug('TEST', 'added new index ' + manufTagCount + ' the amount ' + item.amount);
                        }
                    }
                }
            }
        }
        return itemsByManufAndAmount;
    }
    function groupItemsByManufAmountAndIndate(items, manufSoMaxAmounts){
        var itemsByManufAndAmount = {};
        log.debug('TEST GROUPITEMS', Object.keys(items))
        if(Object.keys(items).length > 0){
            var manufSoMaxAmount, item, manufTagCount, manufTagTotal, isAddedToList, inDate;
            var inDates = [], inDateIndx, inDateTotal = {};
            for(var manuf in items){
                manufSoMaxAmount = manufSoMaxAmounts[manuf];
                manufTagCount = 0;
                manufTagTotal = [];
                inDates = [];
                itemsByManufAndAmount[manuf] = [];

                for(var i = 0; i < items[manuf].length; i++){
                    log.debug('groupItemsByManufAmountAndIndate', 'items[manuf]['+i+']');
                    isAddedToList = false;
                    item = items[manuf][i];
                    inDate = item.indate.getMonth() + '_' + item.indate.getDate() + '_' + item.indate.getFullYear();;
                    if(manufSoMaxAmount == ''){
                        if(inDates.indexOf(inDate) < 0){
                           inDates.push(inDate);
                        }
                        inDateIndx = inDates.indexOf(inDate);
                        if(itemsByManufAndAmount[manuf][inDateIndx] == null){
                            itemsByManufAndAmount[manuf][inDateIndx] = [];
                            manufTagTotal[0] = 0;
                        }
                        itemsByManufAndAmount[manuf][inDateIndx].push({
                            rrLineNo: item.rrLineNo,
                            item: item.item,
                            amount: item.amount
                        });
                        manufTagTotal[inDateIndx] = parseFloat(manufTagTotal[inDateIndx]) + parseFloat(item.amount);
                    }else{
                        //create first element if there is no instance on the object yet
                        if(itemsByManufAndAmount[manuf].length == 0){
                            log.debug('groupItemsByManufAmountAndIndate', 'adding first element of itemsgrouped');
                            itemsByManufAndAmount[manuf][0] = [];
                            manufTagTotal[0] = 0;
                            inDates.push(inDate);
                            log.debug('groupItemsByManufAmountAndIndate', 'itemsGrouped: '+JSON.stringify(itemsByManufAndAmount[manuf])+'manufTagTotal: ' + JSON.stringify(manufTagTotal) + '; inDates: ' + JSON.stringify(inDates));
                        }
                        if(inDates.indexOf(inDate) < 0){
                            log.debug('groupItemsByManufAmountAndIndate', inDate + ' is not found in ' + JSON.stringify(inDates));
                            inDates.push(inDate);
                            itemsByManufAndAmount[manuf][inDates.length-1] = [];
                            manufTagTotal[inDates.length-1] = 0;
                            log.debug('groupItemsByManufAmountAndIndate', 'itemsGrouped: '+JSON.stringify(itemsByManufAndAmount[manuf])+'manufTagTotal: ' + JSON.stringify(manufTagTotal) + '; inDates: ' + JSON.stringify(inDates));
                        }
                        for(var j = 0; j < itemsByManufAndAmount[manuf].length; j++){
                            log.debug('groupItemsByManufAmountAndIndate', inDate + ' == ' + inDates[j] + '; manufTagTotal ' + manufTagTotal[j] + ' + ' + item.amount)
                            if(inDates[j] == inDate){
                                if(manufTagTotal[j] == 0){
                                    isAddedToList = true;
                                    itemsByManufAndAmount[manuf][j].push({
                                        rrLineNo: item.rrLineNo,
                                        item: item.item,
                                        amount: item.amount
                                    });
                                    manufTagTotal[j] = parseFloat(manufTagTotal[j]) + parseFloat(item.amount);
                                    break;
                                }else{

                                }
                            }
                            if(inDates[j] == inDate && (manufTagTotal[j] == 0 || (parseFloat(manufTagTotal[j]) + parseFloat(item.amount)) <= manufSoMaxAmount)){
                                isAddedToList = true;
                                itemsByManufAndAmount[manuf][j].push({
                                    rrLineNo: item.rrLineNo,
                                    item: item.item,
                                    amount: item.amount
                                });
                                manufTagTotal[j] = parseFloat(manufTagTotal[j]) + parseFloat(item.amount);
                                break;
                            }
                            /*if((parseFloat(manufTagTotal[j]) + parseFloat(item.amount)) <= manufSoMaxAmount){
                                isAddedToList = true;
                                itemsByManufAndAmount[manuf][j].push({
                                    rrLineNo: item.rrLineNo,
                                    item: item.item,
                                    amount: item.amount
                                });
                                manufTagTotal[j] = parseFloat(manufTagTotal[j]) + parseFloat(item.amount);
                                break;
                            }*/
                        }
                        if(!isAddedToList){
                            manufTagCount = itemsByManufAndAmount[manuf].length;
                            manufTagTotal.push(item.amount);
                            inDates.push(inDate);
                            itemsByManufAndAmount[manuf][manufTagCount] = [];
                            itemsByManufAndAmount[manuf][manufTagCount].push({
                                rrLineNo: item.rrLineNo,
                                item: item.item,
                                amount: item.amount
                            });
                            //manufTagTotal[manufTagCount] = parseFloat(manufTagTotal[manufTagCount]) + parseFloat(returnableItem.amount);
                            log.debug('TEST', 'added new index ' + manufTagCount + ' the amount ' + item.amount);
                        }
                    }
                }
            }
        }
        return itemsByManufAndAmount;
    }
    function markBinAsReserved(bin){
        var binRec = record.load({
            type: 'bin',
            id: bin,
            isDynamic: true
        });
        binRec.setValue({
            fieldId: 'custrecord_kd_bin_reserved',
            value: true,
            ignoreFieldChange: true
        });
        binRec.save();
    }
    function updateRrLinesTagLabels(rrRec, itemsToUpdate, tagId){
        //var itemsToUpdate = returnableItemsByManufAndAmount[manuf][manufSoIndx];
        var rrLine;
        for(var ituIndx = 0; ituIndx < itemsToUpdate.length; ituIndx++){
            rrLine = itemsToUpdate[ituIndx].rrLineNo;
            rrRec.selectLine({
                sublistId: 'item',
                line: rrLine
            });
            rrRec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: FLD_RR_ITEM_TAG,
                value: tagId,
                ignoreFieldChange: true
            });
            rrRec.commitLine({
                sublistId: 'item'
            });
        }
        return rrRec;
    }
    function assignItemsToSingleBin(items, bin, mrr, rrId, customer, rrRec){
        var tagId = createTagLabelRecord(mrr, rrId, customer, '', bin);
        if(tagId != ''){
            for(var itemsIndx = 0; itemsIndx < items.length; itemsIndx++){
                updateRrLinesTagLabels(rrRec, items, tagId);
            }
        }
    }
    function processItems(itemsByManufAndAmount, binsByManuf, mrr, rrId, customer, rrRec){
        if(Object.keys(itemsByManufAndAmount).length  > 0){
            var binId, byManufIndx;
            var manufBins, tagId;
            for(var manuf in itemsByManufAndAmount){
                manufBins = binsByManuf[manuf];
                if(manufBins != null && manufBins.length > 0){
                    for(var manufSoIndx = 0; manufSoIndx < itemsByManufAndAmount[manuf].length; manufSoIndx++){
                        bin = '';
                        binIndx = '';
                        bin = manufBins[0];
                        
                        if(manufBins.length > 0 && bin != ''){
                            binsByManuf[manuf].splice(0, 1);
                            //log.debug('TEST', 'bins after splice: ' + JSON.stringify(binsByManuf[manuf]));
                            tagId = createTagLabelRecord(mrr, rrId, customer, manuf, bin);
                            if(tagId != ''){
                                markBinAsReserved(bin);
                                log.debug('processItems', 'Tag ID created: ' + tagId)
                                //var returnables = itemsByManufAndAmount[manuf][manufSoIndx];
                                updateRrLinesTagLabels(rrRec, itemsByManufAndAmount[manuf][manufSoIndx], tagId)
                            }
                        }else{
                            tagId = createTagLabelRecord(mrr, rrId, customer, manuf, '');
                            updateRrLinesTagLabels(rrRec, itemsByManufAndAmount[manuf][manufSoIndx], tagId);
                        }
                    }
                }else{
                    for(var manufSoIndx = 0; manufSoIndx < itemsByManufAndAmount[manuf].length; manufSoIndx++){
                        tagId = createTagLabelRecord(mrr, rrId, customer, manuf, '');
                        updateRrLinesTagLabels(rrRec, itemsByManufAndAmount[manuf][manufSoIndx], tagId);
                    }
                }
                //manufName = manufNames[manuf];
            }
        }
    }
    function createTagLabel(rrId){
        try{
            var rrRec = record.load({
                type: REC_RET_REQ,
                id: rrId,
                isDynamic: true
            });

            var mfgProcessing, isHazardous, manuf, manufName, isIndate, inDate, item, amount, tag, retPolicy, inDate;
            var returnableItems = {};
            var inDateItems = {};
            var nonReturnableItems = [];//{};
            var hazardousItems = []//{};
            var noPolicyItems = {};
            var destructionBin = runtime.getCurrentScript().getParameter(SCR_PARAM_DESTRUCTION_BIN);
            var hazardousBin = runtime.getCurrentScript().getParameter(SCR_PARAM_HAZARDOUS_BIN);

            var returnableItemsByManuf = {};
            var returnableManufs = [];
            var manufNames = {};

            for(var i = 0; i < rrRec.getLineCount('item'); i++){
                rrRec.selectLine({
                    sublistId: 'item',
                    line: i
                });

                tag = rrRec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: FLD_RR_ITEM_TAG
                });
                
                if(tag == ''){
                    mfgProcessing = rrRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: FLD_RR_MFG_PROCESSING
                    });
                    isHazardous = rrRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: FLD_RR_IT_HAZARDOUS
                    });
                    manuf = rrRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: FLD_RR_IT_MANUF
                    });
                    manufName = rrRec.getCurrentSublistText({
                        sublistId: 'item',
                        fieldId: FLD_RR_IT_MANUF
                    });
                    isIndate = rrRec.getCurrentSublistText({
                        sublistId: 'item',
                        fieldId: FLD_RR_IT_INDATE_FLAG
                    });
                    inDate = rrRec.getCurrentSublistText({
                        sublistId: 'item',
                        fieldId: FLD_RR_IT_INDATE
                    });
                    item = rrRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item'
                    });
                    amount = rrRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount'
                    });
                    retPolicy = rrRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kd_return_policy'
                    });
                    inDate = rrRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: FLD_RR_IT_INDATE
                    });

                    if(!manufNames.hasOwnProperty(manufName)){
                        manufNames[manuf] = manufName;
                    }
                    if(retPolicy == '' || retPolicy == null){
                        if(!noPolicyItems.hasOwnProperty(manuf)){
                            noPolicyItems[manuf] = [];
                        }
                        noPolicyItems[manuf].push({rrLineNo: i, item: item, amount: amount});
                    }else if(mfgProcessing == PROCESSING_RETURNABLE){
                        if(isIndate == 'T'){
                            if(!inDateItems.hasOwnProperty(manuf)){
                                inDateItems[manuf] = [];
                            }
                            inDateItems[manuf].push({rrLineNo: i, item: item, amount: amount, indate: inDate});
                        }else{
                            if(!returnableItems.hasOwnProperty(manuf)){
                                returnableItems[manuf] = [];
                            }
                            returnableItems[manuf].push({rrLineNo: i, item: item, amount: amount})
                        }
                    }else if(mfgProcessing == PROCESSING_NON_RETURNABLE){
                        if(isHazardous){
                            /*if(!hazardousItems.hasOwnProperty(manuf)){
                                hazardousItems[manuf] = [];
                            }
                            hazardousItems[manuf].push({rrLineNo: i, item: item, amount: amount});*/
                            hazardousItems.push({rrLineNo: i, item: item, amount: amount});
                        }else{
                            /*if(!nonReturnableItems.hasOwnProperty(manuf)){
                                nonReturnableItems[manuf] = [];
                            }
                            nonReturnableItems[manuf].push({rrLineNo: i, item: item, amount: amount});*/
                            nonReturnableItems.push({rrLineNo: i, item: item, amount: amount});
                        }
                    }
    
                    
                    rrRec.commitLine('item');
                }
            }
            log.debug('createTagLabel', 'nonreturnableitems: ' + JSON.stringify(nonReturnableItems));
            var manufSoMaxAmounts = getManufMaxSoAmounts(Object.keys(manufNames));
            var returnableItemsByManufAndAmount = groupItemsByManufAndAmount(returnableItems, manufSoMaxAmounts);
            var inDateItemsByManufAndAmount = groupItemsByManufAmountAndIndate(inDateItems, manufSoMaxAmounts);
            var destructionItemsByManufAndAmount = groupItemsByManufAndAmount(nonReturnableItems, manufSoMaxAmounts);
            var hazardousItemsByManufAndAmount = groupItemsByManufAndAmount(hazardousItems, manufSoMaxAmounts);
            var noPolicyItemsByManufAndAmount = groupItemsByManufAndAmount(noPolicyItems, manufSoMaxAmounts);
            
            /*log.debug('createTagLabel', 'returnableItemsByManufAndAmount: ' + JSON.stringify(returnableItemsByManufAndAmount));
            log.debug('createTagLabel', 'inDateItemsByManufAndAmount: ' + JSON.stringify(inDateItemsByManufAndAmount));
            log.debug('createTagLabel', 'destructionItemsByManufAndAmount: ' + JSON.stringify(destructionItemsByManufAndAmount));
            log.debug('createTagLabel', 'hazardousItemsByManufAndAmount: ' + JSON.stringify(hazardousItemsByManufAndAmount));
            log.debug('createTagLabel', 'noPolicyItemsByManufAndAmount: ' + JSON.stringify(noPolicyItemsByManufAndAmount));*/

            //var recId = currentRec.save();
            //alert(JSON.stringify(returnableItemsByManufAndAmount));
            hBins = [];
            dBins = [];
            rBins = [];
            npBins = [];
            getBins();
            log.debug('after getBins', 'hBins ' + JSON.stringify(hBins));
            log.debug('after getBins', 'dBins ' + JSON.stringify(dBins));
            log.debug('after getBins', 'rBins ' + JSON.stringify(rBins));
            log.debug('after getBins', 'npBins ' + JSON.stringify(npBins));

            var mrr = rrRec.getValue(FLD_RR_MRR);
            var customer = rrRec.getValue(FLD_RR_CUSTOMER);
            var tagId, bin, binIndx, rrLine, binRec;
            
            log.debug('TEST', 'manufNames: ' + JSON.stringify(manufNames));

            log.debug('createTagLabel', 'returnableItemsByManufAndAmount ' + JSON.stringify(returnableItemsByManufAndAmount));
            log.debug('createTagLabel', 'rBinsByManuf ' + JSON.stringify(rBinsByManuf));
            log.debug('createTagLabel', 'returnableItems ' + JSON.stringify(returnableItemsByManufAndAmount))
            processItems(returnableItemsByManufAndAmount, rBinsByManuf, mrr, rrId, customer, rrRec);

            log.debug('createTagLabel', 'inDateItemsByManufAndAmount ' + JSON.stringify(inDateItemsByManufAndAmount));
            log.debug('createTagLabel', 'ridBinsByManuf ' + JSON.stringify(ridBinsByManuf));
            //assignItemsToSingleBin(hazardousItems, hazardousBin, mrr, rrId, customer, rrRec);
            processItems(inDateItemsByManufAndAmount, ridBinsByManuf, mrr, rrId, customer, rrRec);

            log.debug('createTagLabel', 'destructionItemsByManufAndAmount ' + JSON.stringify(destructionItemsByManufAndAmount));
            log.debug('createTagLabel', 'dBinsByManuf ' + JSON.stringify(dBinsByManuf));
            assignItemsToSingleBin(nonReturnableItems, destructionBin, mrr, rrId, customer, rrRec);
            //processItems(destructionItemsByManufAndAmount, dBinsByManuf, mrr, rrId, customer, rrRec);

            log.debug('createTagLabel', 'hazardousItemsByManufAndAmount ' + JSON.stringify(hazardousItemsByManufAndAmount));
            log.debug('createTagLabel', 'hBinsByManuf ' + JSON.stringify(hBinsByManuf));
            assignItemsToSingleBin(hazardousItems, hazardousBin, mrr, rrId, customer, rrRec);
            //processItems(hazardousItemsByManufAndAmount, hBinsByManuf, mrr, rrId, customer, rrRec);

            log.debug('createTagLabel', 'noPolicyItemsByManufAndAmount ' + JSON.stringify(noPolicyItemsByManufAndAmount));
            log.debug('createTagLabel', 'npBinsByManuf ' + JSON.stringify(npBinsByManuf));
            processItems(noPolicyItemsByManufAndAmount, npBinsByManuf, mrr, rrId, customer, rrRec);
            
            rrRec.setValue({
                fieldId: 'custbody_kd_rr_for_tag_label_gen',
                value: false
            });
            log.debug('TEST', 'RR For Tag Label is set to false');
            var allItemsHasTag = true;
            var itemTag;
            for(var i = 0; i < rrRec.getLineCount('item'); i++){
                itemTag = rrRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: FLD_RR_ITEM_TAG,
                    line: i
                });
                log.debug('TEST', 'itemTag ' + itemTag);
                if(itemTag == ''){
                    allItemsHasTag = false;
                    break;
                }
            }
            if(allItemsHasTag){
                rrRec.setValue({
                    fieldId: 'custbody_kd_tag_labels_generated',
                    value: true
                });
            }
            rrRec.save();
            log.debug('TEST', 'RR is saved');
            //location.reload();
        }catch(ex){
            log.debug('ERR', ex.toString());
        }
    }
    function getInputData(){
        log.debug('getInputData', 'START');
        var rrSearch = search.load({
            id: SEA_RR
        });
        rrSearch.filters.push(search.createFilter({
            name: FLD_RR_FOR_TAG_LABEL_GEN,
            operator: search.Operator.IS,
            values: true
        }));
        rrSearch.filters.push(search.createFilter({
            name: 'status',
            operator: search.Operator.IS,
            values: 'CuTrSale102:K'//pending verification
        }));
        return rrSearch; 
    }
    function map(context){
        log.debug('map', 'START');
        try{
            var data = JSON.parse(context.value);
            var rrId = data.id;
            log.debug('map', rrId);
            createTagLabel(rrId);
        }catch(ex){
            log.error({ title: 'map: error', details: ex });
        }
        //var mrrId = runtime.getCurrentScript().getParameter({name:'custscript_mrr_id'});
    }
    function summarize(summary){
        log.debug('summarize', 'START');
        var rrSearch = search.load({
            id: SEA_RR
        });
        rrSearch.filters.push(search.createFilter({
            name: FLD_RR_FOR_TAG_LABEL_GEN,
            operator: search.Operator.IS,
            values: true
        }));
        rrSearch.filters.push(search.createFilter({
            name: 'status',
            operator: search.Operator.IS,
            values: 'CuTrSale102:K'
        }));
        if(rrSearch.run().getRange({ start: 0, end: 1 }).length > 0){
            log.debug('TEST', 'there are still RR to be processed, scheduling another deployment.');
            /*try{
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_kd_mr_create_tag_labels'
                });
                var mrTaskId = mrTask.submit();
                var mrTaskStatus = task.checkStatus({
                    taskId: mrTaskId
                });
                log.debug('TEST', 'MR Task Status ' + mrTaskStatus);
            }catch(ex){
                log.error({title: 'map/reduce task creation', details: ex });
            }*/
        }
    }
    return{
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});