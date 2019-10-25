const { describe, it } = require('mocha')
const { expect } = require('chai')
const { RiotApi } = require('../src')
const { ApiKeyNotFound, RateLimitError } = require('../src/errors')
const { restore, stub } = require('sinon')

describe('Base api', () => {
  const riot = new RiotApi({ key: '' })
  const baseEndpoint = {
    path: '',
    version: 0,
    prefix: ''
  }
  const region = 'LA1'
  const key = 'apikey'
  describe('Arguments', () => {
    it('should throw when missing Riot api key', async () => {
      try {
        await riot.Lol.Champion.rotation(region)
      } catch (e) {
        expect(e).instanceOf(ApiKeyNotFound)
      }
    })
    it('should return correct key when param is an string', () => {
      const api = new RiotApi(key)
      expect(api.key).eq(key)
    })
    it('should return correct key when param is an object', () => {
      const api = new RiotApi({ key })
      expect(api.key).eq(key)
    })
    it('should return correct retry limit value', () => {
      const api = new RiotApi({ rateLimitRetry: false })
      expect(api.rateLimitRetry).eq(false)
    })
    it('should return correct retry limit attempts value', () => {
      const api = new RiotApi({ rateLimitRetryAttempts: 2 })
      expect(api.rateLimitRetryAttempts).eq(2)
    })
    it('should return valid default param', () => {
      const api = new RiotApi(key)
      const exp = {
        key,
        rateLimitRetry: true,
        rateLimitRetryAttempts: 1
      }
      expect(api.getParam()).deep.equals(exp)
    })
  })
  describe('Utils', () => {
    it('base api should have a region variable', () => {
      expect(riot.baseUrl).to.include('$(region)')
    })
    it('should return correct api url', () => {
      const params = {
        region: region
      }
      const path = 'ryze'
      baseEndpoint.path = path
      const url = riot.getApiUrl(baseEndpoint, params)
      expect(url.endsWith(path)).to.be.equal(true)
    })
    it('should return correct api url with api params', () => {
      const params = {
        region: region,
        division: 'wood'
      }
      baseEndpoint.path = 'ryze/$(division)'
      const ends = 'ryze/wood'
      const url = riot.getApiUrl(baseEndpoint, params)
      expect(url.endsWith(ends)).to.be.equal(true)
    })
  })
  describe('Rate limit response', () => {
    it('should return valid response at 2th attempt', async () => {
      const data = { body: 'good' }
      const api = new RiotApi(key)
      const stubApi = stub(api, 'internalRequest')
      stubApi.onCall(0).throwsException(new RateLimitError())
      stubApi.onCall(1).callsFake(() => data)
      const response = await api.request('KR', {})
      restore()
      expect(response.response).deep.eq(data.body)
    })
    it('should throw rate limit error at 3th attempt', async () => {
      const api = new RiotApi(key)
      const stubApi = stub(api, 'internalRequest')
      stubApi.callsFake().throwsException(new RateLimitError())
      try {
        await api.request('KR', {})
      } catch (e) {
        expect(e).instanceOf(RateLimitError)
      }
    })
    it('should throw rate limit when option ins disable', async () => {
      const api = new RiotApi({
        key,
        rateLimitRetry: false,
        rateLimitRetryAttempts: 1
      })
      const stubApi = stub(api, 'internalRequest')
      stubApi.onCall(0).throwsException(new RateLimitError())
      try {
        await api.request('KR', {})
      } catch (e) {
        expect(e).instanceOf(RateLimitError)
      }
    })
    it('should throw rate limit when retry limit retry attempts is lower than 1', async () => {
      const api = new RiotApi({
        key,
        rateLimitRetry: true,
        rateLimitRetryAttempts: 0
      })
      const stubApi = stub(api, 'internalRequest')
      stubApi.onCall(0).throwsException(new RateLimitError())
      try {
        await api.request('KR', {})
      } catch (e) {
        expect(e).instanceOf(RateLimitError)
      }
    })
  })
})
