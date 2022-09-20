/**
*@NApiVersion 2.x
*@NScriptType MapReduceScript
*/

define(['N/search', 'N/record', 'N/format'],
function (search, record, format){
    var SEA_ITEMS_PRICE_UPDATE = 'customsearch_kd_items_price_update';
    var FLD_IT_MANUF_SEGMENT = 'custitem_kod_mfgsegment';
    var SEA_PRICING_POLICY = 'customsearch_kd_pricing_policy';
    var FLD_PP_WAC_ADJ_RATE = 'custrecord_kd_trustwacadjrate';
    var FLD_PP_MARGIN_RATE = 'custrecord_kd_trustmarginrate';
    var FLD_PP_MANUF = 'custrecord_kd_manufacturer';
    var SEA_ITEM_PRICE_LEVEL = 'customsearch_kd_item_price_level';
    var FLD_IT_PRICE_LEVEL = 'pricelevel';
    var FLD_IT_PRICE_LEVEL = 'pricelevel';
    var PRICELEVEL_WAC = 1;
    var PRICELEVEL_UNITPRICE = 2;

    function getPricingPolicy(manufacturer){
        var pricePolicy = {};
        var pricingPolicySearch = search.load(SEA_PRICING_POLICY);
        pricingPolicySearch.filters.push(search.createFilter({
            name: FLD_PP_MANUF,
            operator: search.Operator.ANYOF,
            values: manufacturer
        }));

        var searchRs = pricingPolicySearch.run();
        var rs = searchRs.getRange(0, 1);
        
        for(var i = 0; i < rs.length; i++){
            pricePolicy = {wacadjrate: rs[i].getValue(FLD_PP_WAC_ADJ_RATE), marginrate: rs[i].getValue(FLD_PP_MARGIN_RATE)};
        }

        return pricePolicy;
    }
    function getItemPriceLevels(item){
        var priceLevels = {};
        var priceLevelSearch = search.load(SEA_ITEM_PRICE_LEVEL);
        priceLevelSearch.filters.push(search.createFilter({
            name: 'internalid',
            operator: search.Operator.ANYOF,
            values: item
        }));
        var searchRs = priceLevelSearch.run();
        var rs = searchRs.getRange(0, 1000);
        for(var i = 0; i < rs.length; i++){
            if(rs[i].getValue({name: 'pricelevel', join: 'pricing'}) == 1){
                priceLevels['wac'] = rs[i].getValue({name: 'unitprice', join: 'pricing'})
            }else{
                priceLevels['unitprice'] = rs[i].getValue({name: 'unitprice', join: 'pricing'})
            }
        }

        return priceLevels;
    }
    function getInputData(){
        return search.load({
            id: SEA_ITEMS_PRICE_UPDATE
        });
    }
    function map(context){
        try{
            var data = JSON.parse(context.value); //read the data
            var item = data.values["internalid"].value;//price id
            var itemManuf = data.values[FLD_IT_MANUF_SEGMENT].value;

            var pricingPolicy = getPricingPolicy(itemManuf);
            var priceLevels = getItemPriceLevels(item);
            var itemRec = record.load({
                type: record.Type.INVENTORY_ITEM,
                id: item,
                isDynamic: true,
            });
            var mfgErv, pharmaCreditUp, pharmaCreditErv;
            if(pricingPolicy.wacadjrate != null && pricingPolicy.wacadjrate != '' && priceLevels.wac != null && priceLevels.wac != ''){
                mfgErv = parseFloat(priceLevels.wac) * (parseFloat(1) - (parseFloat(pricingPolicy.wacadjrate)/100));
            }
            if(pricingPolicy.marginrate != null && pricingPolicy.marginrate != '' && priceLevels.unitprice != null && priceLevels.unitprice != ''){
                //pharmaCreditUp = parseFloat(priceLevels.unitprice) * ((parseFloat(100) + parseFloat(pricingPolicy.marginrate))/ 100);
                pharmaCreditUp = parseFloat(priceLevels.unitprice) * (parseFloat(1) - (parseFloat(pricingPolicy.marginrate)/100));
            }
            if(mfgErv != null && mfgErv != '' && pricingPolicy.marginrate != null && pricingPolicy.marginrate != ''){
                //pharmaCreditErv = parseFloat(mfgErv) * ((parseFloat(100) + parseFloat(pricingPolicy.marginrate))/ 100);
                pharmaCreditErv = parseFloat(mfgErv) * (parseFloat(1) - (parseFloat(pricingPolicy.marginrate)/100));
            }
            var priceLevel;
            var isItemUpdated = false;
            for(var i = 0; i < itemRec.getLineCount('price1'); i++){
                itemRec.selectLine({
                    sublistId: 'price1',
                    line: i
                });
                priceLevel = itemRec.getCurrentSublistValue({
                    sublistId: 'price1',
                    fieldId: 'pricelevel'
                })
                if(priceLevel == 4 && mfgErv != null && mfgErv != ''){
                    itemRec.setCurrentSublistValue({
                        sublistId: 'price1',
                        fieldId: 'price_1_',
                        value: format.format({value:mfgErv, type: format.Type.CURRENCY}),
                        ignoreFieldChange: true
                    });
                    isItemUpdated = true;
                }else if(priceLevel == 9 && pharmaCreditUp != null && pharmaCreditUp != ''){
                    itemRec.setCurrentSublistValue({
                        sublistId: 'price1',
                        fieldId: 'price_1_',
                        value: format.format({value:pharmaCreditUp, type: format.Type.CURRENCY}),
                        ignoreFieldChange: true
                    });
                    isItemUpdated = true;
                }else if(priceLevel == 10 && pharmaCreditErv != null && pharmaCreditErv != ''){
                    itemRec.setCurrentSublistValue({
                        sublistId: 'price1',
                        fieldId: 'price_1_',
                        value: format.format({value:pharmaCreditErv, type: format.Type.CURRENCY}),
                        ignoreFieldChange: true
                    });
                    isItemUpdated = true;
                }

                itemRec.commitLine('price1');
            }
            if(isItemUpdated){
                log.debug('TEST', 'Item' + item);
                log.debug('TEST', JSON.stringify(pricingPolicy));
                log.debug('TEST', JSON.stringify(priceLevels));
                log.debug('COMPUTED PRICES', mfgErv + ' : ' + pharmaCreditUp + ' : ' + pharmaCreditErv);
                log.debug('TEST', 'Item' + item);
                itemRec.save({ignoreMandatoryFields: true});
            }else{
                log.debug('TEST', 'Item' + item + ' is NOT UPDATED');
            }
        }catch (ex){ 
            log.error({ title: 'map: error', details: ex }); 
        }
    }
    function summarize(context){
        /*var totalItemsProcessed = 0;
        context.output.iterator().each(function (key, value) {
            totalItemsProcessed++;
        });
        var summaryMessage = "Usage: " + context.usage + " Concurrency: " + context.concurrency +
        " Number of yields: " + context.yields + " Total Items Processed: " + totalItemsProcessed;
        log.audit({ title: 'Summary of usase', details: summaryMessage });*/
    }
    return {
        getInputData: getInputData,
        map: map,
        //reduce: reduce,
        summarize: summarize
    };
});