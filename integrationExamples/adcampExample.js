var PREBID_TIMEOUT = 8000

var pbjs = pbjs || {}
pbjs.que = pbjs.que || []

pbjs.que.push(function() {
    let adUnits = [{
        code: 'ad_unit_code',
        mediaTypes: {
            banner: {
                sizes: [[300, 250]],
            },
        },
        bids: [
            {
                bidder: 'adcamp',
                params: {
                    host: 'https://stage.prebid.kost.tv',
                    publisherId: "1",
                },
            },
        ],
        ortb2Imp: {
            bidfloor: '0.5',
            bodfloorcur: 'RUB',
        },
    }]

    pbjs.setConfig({
        bidderTimeout: 20000,
        ortb2: {
            site: {
                name: 'autonews',
                domain: 'autonews.blog',
            },
            cur: [
                'RUB',
            ],
            user: {
              buyeruid: '22781943-d861-43c7-9576-c95261660d58'
            }
        },
    })

    pbjs.addAdUnits(adUnits)
    console.log(pbjs)
    pbjs.requestBids({
        bidsBackHandler: function(bidResponse) {
            console.log(bidResponse)
            console.log('Done')
        }
    })
})
