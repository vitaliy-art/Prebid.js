import { registerBidder } from '../src/adapters/bidderFactory.js'
import { config } from '../src/config.js'
import { BANNER } from '../src/mediaTypes.js'
import { deepAccess, isFn, logError, logInfo } from '../src/utils.js'

const BIDDER_CODE = 'adcamp'
const TEST = false

const PARAM_HOST = 'host'
const PARAM_PUBLISHER = 'publisherId'

function getBidFloor(bid) {
  if (!isFn(bid.getFloor)) {
    return deepAccess(bid, 'params.bidfloor', 0);
  }

  try {
    const bidFloor = bid.getFloor({
      currency: 'RUB',
      mediaType: '*',
      size: '*',
    });

    return bidFloor.floor;
  } catch (err) {
    logError(err);
    return 0;
  }
}

function getParam(bid, param) {
  const {
    host,
    publisherId,
  } = bid.params

  let map = new Object()
  map[PARAM_HOST] = host
  map[PARAM_PUBLISHER] = publisherId

  return map[param]
}

export const spec = {
  code: BIDDER_CODE,
  supportedMediaTypes: [ BANNER, ],
  gvlid: undefined,
  aliases: [],

  isBidRequestValid(bid) {
    if (!bid.params) { return false }

    if (!bid.params.host || bid.params.host == '') { return false }

    return true
  },

  buildRequests(validBidRequests, bidderRequest) {
    const url = getParam(validBidRequests[0], PARAM_HOST) + '/bidder/openrtb2/auction'
    const rtb = bidderRequest.ortb2
    let req = {
      id: bidderRequest.auctionId,
      // imp:
      site: rtb.site,
      app: rtb.app,
      device: rtb.device,
      user: rtb.user,
      test: TEST ? 1 : 0,
      at: 1,
      tmax: config.getConfig('bidderTimeout'),
      // wseat:
      // bseat:
      // allimps:
      cur: rtb.cur,
      wlang: rtb.wlang,
      wlangb: rtb.wlangb,
      bcat: rtb.bcat,
      cattax: rtb.cattax,
      badv: rtb.badv,
      bapp: rtb.bapp,
      source: rtb.source,
      regs: rtb.regs,
      ext: {
        mediaType: 0,
      },
    }

    req.site.publisher = { id: getParam(validBidRequests[0], PARAM_PUBLISHER) }
    let impressions = []
    for (let i = 0; i < validBidRequests.length; i++) {
      const bidReq = validBidRequests[i]
      const media = bidReq.mediaTypes
      const sizes = media.banner.sizes[0]
      const imp = {
        id: bidReq.bidId,
        banner: {
          w: sizes[0],
          h: sizes[1],
        },
        video: media.video,
        audio: media.audio,
        native: media.native,
        // pmp:
        // displaymanager
        // displaymanagerver
        // instl
        // tagid
        bidfloor: getBidFloor(bidReq),
        bidfloorcur: config.getConfig('currency.adServerCurrency') || 'RUB',
        // clickbrowser:
        // secure:
        // iframebuster:
        // rwdd:
        // ssai:
        // exp:
      }

      impressions.push(imp)
    }

    req.imp = impressions
    logInfo(req)
    return [{
      method: 'POST',
      url: url,
      data: req,
      options: {
        withCredentials: false,
        crossOrigin: true,
      },
    }]
  },

  interpretResponse(serverResponse, _) {
    const res = serverResponse
    if (!res.body) { return [] }

    let result = []
    const { seatbid, cur } = res.body
    for (let i = 0; i < seatbid[0].length; i++) {
      const bid = seatbid[0][i]
      const bidRes = {
        requestId: bid.bidid,
        cpm: bid.price,
        currency: cur,
        width: bid.w,
        height: bid.h,
        ad: bid.adm,
        ttl: bid.dur || 360,
        creativeId: bid.adid,
        netRevenue: true,
        dealId: bid.dealid,
      }

      result.push(bidRes)
    }

    return result
  },

  getUserSyncs(syncOptions, serverResponses, gdprConsent, uspConsent) {},

  onTimeout(timeoutData) {},

  onBidWon(bid) {},

  onSetTargeting(bid) {},

//   onBidderError({ error, bidderRequest }) {},
}

registerBidder(spec)
