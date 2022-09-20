/**
*@NApiVersion 2.x
*@NScriptType MapReduceScript
*/
define(['N/runtime', 'N/search'],
    function(runtime, search){
        var REC_MANUF = 'customrecord_csegmanufacturer';
        var manufBatch = {};
        var soMaxAmountByManuf = {};
        function setTimeout(aFunction, milliseconds){
            var date = new Date();
            date.setMilliseconds(date.getMilliseconds() + milliseconds);
            while(new Date() < date){
            }
            
            return aFunction();
        }
        function getManufSoMaxAmount(manuf){
            var fieldLookUp = search.lookupFields({
                type: REC_MANUF,
                id: manuf,
                columns: ['custrecord_kd_mfgmaxvaljue']
            });
            log.debug('TEST', JSON.stringify(fieldLookUp))
            return fieldLookUp.custrecord_kd_mfgmaxvaljue;
        }
        function getInputData(){
            log.debug('getInputData', 'START');
            var searchId = runtime.getCurrentScript().getParameter({name: 'custscript_rr_lines_for_batch_search'});
            return search.load({
                id: searchId
            });
        }
        function map(context){
            log.debug('MAP', 'context value ' + JSON.stringify(context.value));
            var data = JSON.parse(context.value);
            var manuf = data.values.custcol_kd_item_manufacturer.value;
            var tag = data.values.custcol_kd_baglabel_link.value;
            var amount = data.values.amount * -1;
            var manufSoMaxAmount;
            log.debug('MAP', 'manuf ' + manuf);
            if(!manufBatch.hasOwnProperty(manuf)){
                manufBatch[manuf] = [];
                manufSoMaxAmount = getManufSoMaxAmount(manuf);
                soMaxAmountByManuf[manuf] = manufSoMaxAmount;
                /*if(soMaxAmountByManuf[manuf] == '' || soMaxAmountByManuf[manuf] == null){
                    log.debug('TEST', 'MANUF HAS NO SET SO MAX AMOUNT')
                }*/
                log.debug('MAP', 'manufBatch added manuf ' + JSON.stringify(manufBatch));
            }
            
            if(manufBatch[manuf].length == 0){
                log.debug('TEST', 'manuf batch does not have elements yet');
                log.debug('TEST', 'amount: ' + amount);
                manufBatch[manuf].push({
                    sumoftags: amount,
                    tags: [tag]
                });
                log.debug('TEST', 'manufBatch ' + JSON.stringify(manufBatch[manuf]));
            }else{
                log.debug('TEST', 'manuf batch have elements');
                var indx = manufBatch[manuf].length - 1;
                log.debug('TEST', 'manuf batch latest index ' + indx);
                if(soMaxAmountByManuf[manuf] != '' && soMaxAmountByManuf[manuf] != null && soMaxAmountByManuf[manuf] > 0){
                    if(parseFloat(manufBatch[manuf][indx].sumoftags) + parseFloat(amount) <= soMaxAmountByManuf[manuf]){
                        manufBatch[manuf][indx].sumoftags = parseFloat(manufBatch[manuf][indx].sumoftags) + parseFloat(amount);
                        if(manufBatch[manuf][indx].tags.indexOf(tag) < 0){
                            manufBatch[manuf][indx].tags.push(tag);
                        }
                    }else{
                        manufBatch[manuf].push({
                            sumoftags: amount,
                            tags: [tag]
                        });
                    }
                }else{
                    manufBatch[manuf][indx].sumoftags = parseFloat(manufBatch[manuf][indx].sumoftags) + parseFloat(amount);
                    if(manufBatch[manuf][indx].tags.indexOf(tag) < 0){
                        manufBatch[manuf][indx].tags.push(tag);
                    }
                }
            }
            //manufBatch[manuf].push(data.values.custcol_kd_baglabel_link.value);

            log.debug('MAP', 'manufBatch ' + JSON.stringify(manufBatch));
            //setTimeout(function(){ log.debug('Ran after 180 seconds'); }, 180000);
            context.write(manuf, manufBatch[manuf]);
        }
        function reduce(context){
            log.debug('REDUCE', 'context ' + JSON.stringify(context.values));
            log.debug('REDUCE', 'manufBatch' + JSON.stringify(manufBatch));
        }
        function summarize(context){
            //log.debug('SUMMARIZE', 'context value ' + JSON.stringify(context.value))
            log.debug('SUMMARIZE', 'manufBatch ' + JSON.stringify(manufBatch))
        }
    return{
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});