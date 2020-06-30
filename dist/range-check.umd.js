(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.rangeCheck = {})));
}(this, (function (exports) { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var ipaddr = createCommonjsModule(function (module) {
	(function() {
	  var expandIPv6, ipaddr, ipv4Part, ipv4Regexes, ipv6Part, ipv6Regexes, matchCIDR, root, zoneIndex;

	  ipaddr = {};

	  root = this;

	  if ((module !== null) && module.exports) {
	    module.exports = ipaddr;
	  } else {
	    root['ipaddr'] = ipaddr;
	  }

	  matchCIDR = function(first, second, partSize, cidrBits) {
	    var part, shift;
	    if (first.length !== second.length) {
	      throw new Error("ipaddr: cannot match CIDR for objects with different lengths");
	    }
	    part = 0;
	    while (cidrBits > 0) {
	      shift = partSize - cidrBits;
	      if (shift < 0) {
	        shift = 0;
	      }
	      if (first[part] >> shift !== second[part] >> shift) {
	        return false;
	      }
	      cidrBits -= partSize;
	      part += 1;
	    }
	    return true;
	  };

	  ipaddr.subnetMatch = function(address, rangeList, defaultName) {
	    var k, len, rangeName, rangeSubnets, subnet;
	    if (defaultName == null) {
	      defaultName = 'unicast';
	    }
	    for (rangeName in rangeList) {
	      rangeSubnets = rangeList[rangeName];
	      if (rangeSubnets[0] && !(rangeSubnets[0] instanceof Array)) {
	        rangeSubnets = [rangeSubnets];
	      }
	      for (k = 0, len = rangeSubnets.length; k < len; k++) {
	        subnet = rangeSubnets[k];
	        if (address.kind() === subnet[0].kind()) {
	          if (address.match.apply(address, subnet)) {
	            return rangeName;
	          }
	        }
	      }
	    }
	    return defaultName;
	  };

	  ipaddr.IPv4 = (function() {
	    function IPv4(octets) {
	      var k, len, octet;
	      if (octets.length !== 4) {
	        throw new Error("ipaddr: ipv4 octet count should be 4");
	      }
	      for (k = 0, len = octets.length; k < len; k++) {
	        octet = octets[k];
	        if (!((0 <= octet && octet <= 255))) {
	          throw new Error("ipaddr: ipv4 octet should fit in 8 bits");
	        }
	      }
	      this.octets = octets;
	    }

	    IPv4.prototype.kind = function() {
	      return 'ipv4';
	    };

	    IPv4.prototype.toString = function() {
	      return this.octets.join(".");
	    };

	    IPv4.prototype.toNormalizedString = function() {
	      return this.toString();
	    };

	    IPv4.prototype.toByteArray = function() {
	      return this.octets.slice(0);
	    };

	    IPv4.prototype.match = function(other, cidrRange) {
	      var ref;
	      if (cidrRange === void 0) {
	        ref = other, other = ref[0], cidrRange = ref[1];
	      }
	      if (other.kind() !== 'ipv4') {
	        throw new Error("ipaddr: cannot match ipv4 address with non-ipv4 one");
	      }
	      return matchCIDR(this.octets, other.octets, 8, cidrRange);
	    };

	    IPv4.prototype.SpecialRanges = {
	      unspecified: [[new IPv4([0, 0, 0, 0]), 8]],
	      broadcast: [[new IPv4([255, 255, 255, 255]), 32]],
	      multicast: [[new IPv4([224, 0, 0, 0]), 4]],
	      linkLocal: [[new IPv4([169, 254, 0, 0]), 16]],
	      loopback: [[new IPv4([127, 0, 0, 0]), 8]],
	      carrierGradeNat: [[new IPv4([100, 64, 0, 0]), 10]],
	      "private": [[new IPv4([10, 0, 0, 0]), 8], [new IPv4([172, 16, 0, 0]), 12], [new IPv4([192, 168, 0, 0]), 16]],
	      reserved: [[new IPv4([192, 0, 0, 0]), 24], [new IPv4([192, 0, 2, 0]), 24], [new IPv4([192, 88, 99, 0]), 24], [new IPv4([198, 51, 100, 0]), 24], [new IPv4([203, 0, 113, 0]), 24], [new IPv4([240, 0, 0, 0]), 4]]
	    };

	    IPv4.prototype.range = function() {
	      return ipaddr.subnetMatch(this, this.SpecialRanges);
	    };

	    IPv4.prototype.toIPv4MappedAddress = function() {
	      return ipaddr.IPv6.parse("::ffff:" + (this.toString()));
	    };

	    IPv4.prototype.prefixLengthFromSubnetMask = function() {
	      var cidr, i, k, octet, stop, zeros, zerotable;
	      zerotable = {
	        0: 8,
	        128: 7,
	        192: 6,
	        224: 5,
	        240: 4,
	        248: 3,
	        252: 2,
	        254: 1,
	        255: 0
	      };
	      cidr = 0;
	      stop = false;
	      for (i = k = 3; k >= 0; i = k += -1) {
	        octet = this.octets[i];
	        if (octet in zerotable) {
	          zeros = zerotable[octet];
	          if (stop && zeros !== 0) {
	            return null;
	          }
	          if (zeros !== 8) {
	            stop = true;
	          }
	          cidr += zeros;
	        } else {
	          return null;
	        }
	      }
	      return 32 - cidr;
	    };

	    return IPv4;

	  })();

	  ipv4Part = "(0?\\d+|0x[a-f0-9]+)";

	  ipv4Regexes = {
	    fourOctet: new RegExp("^" + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "$", 'i'),
	    longValue: new RegExp("^" + ipv4Part + "$", 'i')
	  };

	  ipaddr.IPv4.parser = function(string) {
	    var match, parseIntAuto, part, shift, value;
	    parseIntAuto = function(string) {
	      if (string[0] === "0" && string[1] !== "x") {
	        return parseInt(string, 8);
	      } else {
	        return parseInt(string);
	      }
	    };
	    if (match = string.match(ipv4Regexes.fourOctet)) {
	      return (function() {
	        var k, len, ref, results;
	        ref = match.slice(1, 6);
	        results = [];
	        for (k = 0, len = ref.length; k < len; k++) {
	          part = ref[k];
	          results.push(parseIntAuto(part));
	        }
	        return results;
	      })();
	    } else if (match = string.match(ipv4Regexes.longValue)) {
	      value = parseIntAuto(match[1]);
	      if (value > 0xffffffff || value < 0) {
	        throw new Error("ipaddr: address outside defined range");
	      }
	      return ((function() {
	        var k, results;
	        results = [];
	        for (shift = k = 0; k <= 24; shift = k += 8) {
	          results.push((value >> shift) & 0xff);
	        }
	        return results;
	      })()).reverse();
	    } else {
	      return null;
	    }
	  };

	  ipaddr.IPv6 = (function() {
	    function IPv6(parts, zoneId) {
	      var i, k, l, len, part, ref;
	      if (parts.length === 16) {
	        this.parts = [];
	        for (i = k = 0; k <= 14; i = k += 2) {
	          this.parts.push((parts[i] << 8) | parts[i + 1]);
	        }
	      } else if (parts.length === 8) {
	        this.parts = parts;
	      } else {
	        throw new Error("ipaddr: ipv6 part count should be 8 or 16");
	      }
	      ref = this.parts;
	      for (l = 0, len = ref.length; l < len; l++) {
	        part = ref[l];
	        if (!((0 <= part && part <= 0xffff))) {
	          throw new Error("ipaddr: ipv6 part should fit in 16 bits");
	        }
	      }
	      if (zoneId) {
	        this.zoneId = zoneId;
	      }
	    }

	    IPv6.prototype.kind = function() {
	      return 'ipv6';
	    };

	    IPv6.prototype.toString = function() {
	      return this.toNormalizedString().replace(/((^|:)(0(:|$))+)/, '::');
	    };

	    IPv6.prototype.toRFC5952String = function() {
	      var bestMatchIndex, bestMatchLength, match, regex, string;
	      regex = /((^|:)(0(:|$)){2,})/g;
	      string = this.toNormalizedString();
	      bestMatchIndex = 0;
	      bestMatchLength = -1;
	      while ((match = regex.exec(string))) {
	        if (match[0].length > bestMatchLength) {
	          bestMatchIndex = match.index;
	          bestMatchLength = match[0].length;
	        }
	      }
	      if (bestMatchLength < 0) {
	        return string;
	      }
	      return string.substring(0, bestMatchIndex) + '::' + string.substring(bestMatchIndex + bestMatchLength);
	    };

	    IPv6.prototype.toByteArray = function() {
	      var bytes, k, len, part, ref;
	      bytes = [];
	      ref = this.parts;
	      for (k = 0, len = ref.length; k < len; k++) {
	        part = ref[k];
	        bytes.push(part >> 8);
	        bytes.push(part & 0xff);
	      }
	      return bytes;
	    };

	    IPv6.prototype.toNormalizedString = function() {
	      var addr, part, suffix;
	      addr = ((function() {
	        var k, len, ref, results;
	        ref = this.parts;
	        results = [];
	        for (k = 0, len = ref.length; k < len; k++) {
	          part = ref[k];
	          results.push(part.toString(16));
	        }
	        return results;
	      }).call(this)).join(":");
	      suffix = '';
	      if (this.zoneId) {
	        suffix = '%' + this.zoneId;
	      }
	      return addr + suffix;
	    };

	    IPv6.prototype.toFixedLengthString = function() {
	      var addr, part, suffix;
	      addr = ((function() {
	        var k, len, ref, results;
	        ref = this.parts;
	        results = [];
	        for (k = 0, len = ref.length; k < len; k++) {
	          part = ref[k];
	          results.push(part.toString(16).padStart(4, '0'));
	        }
	        return results;
	      }).call(this)).join(":");
	      suffix = '';
	      if (this.zoneId) {
	        suffix = '%' + this.zoneId;
	      }
	      return addr + suffix;
	    };

	    IPv6.prototype.match = function(other, cidrRange) {
	      var ref;
	      if (cidrRange === void 0) {
	        ref = other, other = ref[0], cidrRange = ref[1];
	      }
	      if (other.kind() !== 'ipv6') {
	        throw new Error("ipaddr: cannot match ipv6 address with non-ipv6 one");
	      }
	      return matchCIDR(this.parts, other.parts, 16, cidrRange);
	    };

	    IPv6.prototype.SpecialRanges = {
	      unspecified: [new IPv6([0, 0, 0, 0, 0, 0, 0, 0]), 128],
	      linkLocal: [new IPv6([0xfe80, 0, 0, 0, 0, 0, 0, 0]), 10],
	      multicast: [new IPv6([0xff00, 0, 0, 0, 0, 0, 0, 0]), 8],
	      loopback: [new IPv6([0, 0, 0, 0, 0, 0, 0, 1]), 128],
	      uniqueLocal: [new IPv6([0xfc00, 0, 0, 0, 0, 0, 0, 0]), 7],
	      ipv4Mapped: [new IPv6([0, 0, 0, 0, 0, 0xffff, 0, 0]), 96],
	      rfc6145: [new IPv6([0, 0, 0, 0, 0xffff, 0, 0, 0]), 96],
	      rfc6052: [new IPv6([0x64, 0xff9b, 0, 0, 0, 0, 0, 0]), 96],
	      '6to4': [new IPv6([0x2002, 0, 0, 0, 0, 0, 0, 0]), 16],
	      teredo: [new IPv6([0x2001, 0, 0, 0, 0, 0, 0, 0]), 32],
	      reserved: [[new IPv6([0x2001, 0xdb8, 0, 0, 0, 0, 0, 0]), 32]]
	    };

	    IPv6.prototype.range = function() {
	      return ipaddr.subnetMatch(this, this.SpecialRanges);
	    };

	    IPv6.prototype.isIPv4MappedAddress = function() {
	      return this.range() === 'ipv4Mapped';
	    };

	    IPv6.prototype.toIPv4Address = function() {
	      var high, low, ref;
	      if (!this.isIPv4MappedAddress()) {
	        throw new Error("ipaddr: trying to convert a generic ipv6 address to ipv4");
	      }
	      ref = this.parts.slice(-2), high = ref[0], low = ref[1];
	      return new ipaddr.IPv4([high >> 8, high & 0xff, low >> 8, low & 0xff]);
	    };

	    IPv6.prototype.prefixLengthFromSubnetMask = function() {
	      var cidr, i, k, part, stop, zeros, zerotable;
	      zerotable = {
	        0: 16,
	        32768: 15,
	        49152: 14,
	        57344: 13,
	        61440: 12,
	        63488: 11,
	        64512: 10,
	        65024: 9,
	        65280: 8,
	        65408: 7,
	        65472: 6,
	        65504: 5,
	        65520: 4,
	        65528: 3,
	        65532: 2,
	        65534: 1,
	        65535: 0
	      };
	      cidr = 0;
	      stop = false;
	      for (i = k = 7; k >= 0; i = k += -1) {
	        part = this.parts[i];
	        if (part in zerotable) {
	          zeros = zerotable[part];
	          if (stop && zeros !== 0) {
	            return null;
	          }
	          if (zeros !== 16) {
	            stop = true;
	          }
	          cidr += zeros;
	        } else {
	          return null;
	        }
	      }
	      return 128 - cidr;
	    };

	    return IPv6;

	  })();

	  ipv6Part = "(?:[0-9a-f]+::?)+";

	  zoneIndex = "%[0-9a-z]{1,}";

	  ipv6Regexes = {
	    zoneIndex: new RegExp(zoneIndex, 'i'),
	    "native": new RegExp("^(::)?(" + ipv6Part + ")?([0-9a-f]+)?(::)?(" + zoneIndex + ")?$", 'i'),
	    transitional: new RegExp(("^((?:" + ipv6Part + ")|(?:::)(?:" + ipv6Part + ")?)") + (ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part) + ("(" + zoneIndex + ")?$"), 'i')
	  };

	  expandIPv6 = function(string, parts) {
	    var colonCount, lastColon, part, replacement, replacementCount, zoneId;
	    if (string.indexOf('::') !== string.lastIndexOf('::')) {
	      return null;
	    }
	    zoneId = (string.match(ipv6Regexes['zoneIndex']) || [])[0];
	    if (zoneId) {
	      zoneId = zoneId.substring(1);
	      string = string.replace(/%.+$/, '');
	    }
	    colonCount = 0;
	    lastColon = -1;
	    while ((lastColon = string.indexOf(':', lastColon + 1)) >= 0) {
	      colonCount++;
	    }
	    if (string.substr(0, 2) === '::') {
	      colonCount--;
	    }
	    if (string.substr(-2, 2) === '::') {
	      colonCount--;
	    }
	    if (colonCount > parts) {
	      return null;
	    }
	    replacementCount = parts - colonCount;
	    replacement = ':';
	    while (replacementCount--) {
	      replacement += '0:';
	    }
	    string = string.replace('::', replacement);
	    if (string[0] === ':') {
	      string = string.slice(1);
	    }
	    if (string[string.length - 1] === ':') {
	      string = string.slice(0, -1);
	    }
	    parts = (function() {
	      var k, len, ref, results;
	      ref = string.split(":");
	      results = [];
	      for (k = 0, len = ref.length; k < len; k++) {
	        part = ref[k];
	        results.push(parseInt(part, 16));
	      }
	      return results;
	    })();
	    return {
	      parts: parts,
	      zoneId: zoneId
	    };
	  };

	  ipaddr.IPv6.parser = function(string) {
	    var addr, k, len, match, octet, octets, zoneId;
	    if (ipv6Regexes['native'].test(string)) {
	      return expandIPv6(string, 8);
	    } else if (match = string.match(ipv6Regexes['transitional'])) {
	      zoneId = match[6] || '';
	      addr = expandIPv6(match[1].slice(0, -1) + zoneId, 6);
	      if (addr.parts) {
	        octets = [parseInt(match[2]), parseInt(match[3]), parseInt(match[4]), parseInt(match[5])];
	        for (k = 0, len = octets.length; k < len; k++) {
	          octet = octets[k];
	          if (!((0 <= octet && octet <= 255))) {
	            return null;
	          }
	        }
	        addr.parts.push(octets[0] << 8 | octets[1]);
	        addr.parts.push(octets[2] << 8 | octets[3]);
	        return {
	          parts: addr.parts,
	          zoneId: addr.zoneId
	        };
	      }
	    }
	    return null;
	  };

	  ipaddr.IPv4.isIPv4 = ipaddr.IPv6.isIPv6 = function(string) {
	    return this.parser(string) !== null;
	  };

	  ipaddr.IPv4.isValid = function(string) {
	    try {
	      new this(this.parser(string));
	      return true;
	    } catch (error1) {
	      return false;
	    }
	  };

	  ipaddr.IPv4.isValidFourPartDecimal = function(string) {
	    if (ipaddr.IPv4.isValid(string) && string.match(/^(0|[1-9]\d*)(\.(0|[1-9]\d*)){3}$/)) {
	      return true;
	    } else {
	      return false;
	    }
	  };

	  ipaddr.IPv6.isValid = function(string) {
	    var addr;
	    if (typeof string === "string" && string.indexOf(":") === -1) {
	      return false;
	    }
	    try {
	      addr = this.parser(string);
	      new this(addr.parts, addr.zoneId);
	      return true;
	    } catch (error1) {
	      return false;
	    }
	  };

	  ipaddr.IPv4.parse = function(string) {
	    var parts;
	    parts = this.parser(string);
	    if (parts === null) {
	      throw new Error("ipaddr: string is not formatted like ip address");
	    }
	    return new this(parts);
	  };

	  ipaddr.IPv6.parse = function(string) {
	    var addr;
	    addr = this.parser(string);
	    if (addr.parts === null) {
	      throw new Error("ipaddr: string is not formatted like ip address");
	    }
	    return new this(addr.parts, addr.zoneId);
	  };

	  ipaddr.IPv4.parseCIDR = function(string) {
	    var maskLength, match, parsed;
	    if (match = string.match(/^(.+)\/(\d+)$/)) {
	      maskLength = parseInt(match[2]);
	      if (maskLength >= 0 && maskLength <= 32) {
	        parsed = [this.parse(match[1]), maskLength];
	        Object.defineProperty(parsed, 'toString', {
	          value: function() {
	            return this.join('/');
	          }
	        });
	        return parsed;
	      }
	    }
	    throw new Error("ipaddr: string is not formatted like an IPv4 CIDR range");
	  };

	  ipaddr.IPv4.subnetMaskFromPrefixLength = function(prefix) {
	    var filledOctetCount, j, octets;
	    prefix = parseInt(prefix);
	    if (prefix < 0 || prefix > 32) {
	      throw new Error('ipaddr: invalid IPv4 prefix length');
	    }
	    octets = [0, 0, 0, 0];
	    j = 0;
	    filledOctetCount = Math.floor(prefix / 8);
	    while (j < filledOctetCount) {
	      octets[j] = 255;
	      j++;
	    }
	    if (filledOctetCount < 4) {
	      octets[filledOctetCount] = Math.pow(2, prefix % 8) - 1 << 8 - (prefix % 8);
	    }
	    return new this(octets);
	  };

	  ipaddr.IPv4.broadcastAddressFromCIDR = function(string) {
	    var cidr, i, ipInterfaceOctets, octets, subnetMaskOctets;
	    try {
	      cidr = this.parseCIDR(string);
	      ipInterfaceOctets = cidr[0].toByteArray();
	      subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr[1]).toByteArray();
	      octets = [];
	      i = 0;
	      while (i < 4) {
	        octets.push(parseInt(ipInterfaceOctets[i], 10) | parseInt(subnetMaskOctets[i], 10) ^ 255);
	        i++;
	      }
	      return new this(octets);
	    } catch (error1) {
	      throw new Error('ipaddr: the address does not have IPv4 CIDR format');
	    }
	  };

	  ipaddr.IPv4.networkAddressFromCIDR = function(string) {
	    var cidr, i, ipInterfaceOctets, octets, subnetMaskOctets;
	    try {
	      cidr = this.parseCIDR(string);
	      ipInterfaceOctets = cidr[0].toByteArray();
	      subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr[1]).toByteArray();
	      octets = [];
	      i = 0;
	      while (i < 4) {
	        octets.push(parseInt(ipInterfaceOctets[i], 10) & parseInt(subnetMaskOctets[i], 10));
	        i++;
	      }
	      return new this(octets);
	    } catch (error1) {
	      throw new Error('ipaddr: the address does not have IPv4 CIDR format');
	    }
	  };

	  ipaddr.IPv6.parseCIDR = function(string) {
	    var maskLength, match, parsed;
	    if (match = string.match(/^(.+)\/(\d+)$/)) {
	      maskLength = parseInt(match[2]);
	      if (maskLength >= 0 && maskLength <= 128) {
	        parsed = [this.parse(match[1]), maskLength];
	        Object.defineProperty(parsed, 'toString', {
	          value: function() {
	            return this.join('/');
	          }
	        });
	        return parsed;
	      }
	    }
	    throw new Error("ipaddr: string is not formatted like an IPv6 CIDR range");
	  };

	  ipaddr.isValid = function(string) {
	    return ipaddr.IPv6.isValid(string) || ipaddr.IPv4.isValid(string);
	  };

	  ipaddr.parse = function(string) {
	    if (ipaddr.IPv6.isValid(string)) {
	      return ipaddr.IPv6.parse(string);
	    } else if (ipaddr.IPv4.isValid(string)) {
	      return ipaddr.IPv4.parse(string);
	    } else {
	      throw new Error("ipaddr: the address has neither IPv6 nor IPv4 format");
	    }
	  };

	  ipaddr.parseCIDR = function(string) {
	    try {
	      return ipaddr.IPv6.parseCIDR(string);
	    } catch (error1) {
	      try {
	        return ipaddr.IPv4.parseCIDR(string);
	      } catch (error1) {
	        throw new Error("ipaddr: the address has neither IPv6 nor IPv4 CIDR format");
	      }
	    }
	  };

	  ipaddr.fromByteArray = function(bytes) {
	    var length;
	    length = bytes.length;
	    if (length === 4) {
	      return new ipaddr.IPv4(bytes);
	    } else if (length === 16) {
	      return new ipaddr.IPv6(bytes);
	    } else {
	      throw new Error("ipaddr: the binary input is neither an IPv6 nor IPv4 address");
	    }
	  };

	  ipaddr.process = function(string) {
	    var addr;
	    addr = this.parse(string);
	    if (addr.kind() === 'ipv6' && addr.isIPv4MappedAddress()) {
	      return addr.toIPv4Address();
	    } else {
	      return addr;
	    }
	  };

	}).call(commonjsGlobal);
	});

	var ip6 = createCommonjsModule(function (module, exports) {
	/**
	 * Created by elgs on 3/5/16.
	 */
	const normalize = function (a) {
	   if (!_validate(a)) {
	      throw new Error('Invalid address: ' + a);
	   }
	   a = a.toLowerCase();

	   const nh = a.split(/\:\:/g);
	   if (nh.length > 2) {
	      throw new Error('Invalid address: ' + a);
	   }

	   let sections = [];
	   if (nh.length == 1) {
	      // full mode
	      sections = a.split(/\:/g);
	      if (sections.length !== 8) {
	         throw new Error('Invalid address: ' + a);
	      }
	   } else if (nh.length == 2) {
	      // compact mode
	      const n = nh[0];
	      const h = nh[1];
	      const ns = n.split(/\:/g);
	      const hs = h.split(/\:/g);
	      for (let i in ns) {
	         sections[i] = ns[i];
	      }
	      for (let i = hs.length; i > 0; --i) {
	         sections[7 - (hs.length - i)] = hs[i - 1];
	      }
	   }
	   for (let i = 0; i < 8; ++i) {
	      if (sections[i] === undefined) {
	         sections[i] = '0000';
	      }
	      sections[i] = _leftPad(sections[i], '0', 4);
	   }
	   return sections.join(':');
	};

	const abbreviate = function (a) {
	   if (!_validate(a)) {
	      throw new Error('Invalid address: ' + a);
	   }
	   a = normalize(a);
	   a = a.replace(/0000/g, 'g');
	   a = a.replace(/\:000/g, ':');
	   a = a.replace(/\:00/g, ':');
	   a = a.replace(/\:0/g, ':');
	   a = a.replace(/g/g, '0');
	   const sections = a.split(/\:/g);
	   let zPreviousFlag = false;
	   let zeroStartIndex = -1;
	   let zeroLength = 0;
	   let zStartIndex = -1;
	   let zLength = 0;
	   for (let i = 0; i < 8; ++i) {
	      const section = sections[i];
	      let zFlag = (section === '0');
	      if (zFlag && !zPreviousFlag) {
	         zStartIndex = i;
	      }
	      if (!zFlag && zPreviousFlag) {
	         zLength = i - zStartIndex;
	      }
	      if (zLength > 1 && zLength > zeroLength) {
	         zeroStartIndex = zStartIndex;
	         zeroLength = zLength;
	      }
	      zPreviousFlag = (section === '0');
	   }
	   if (zPreviousFlag) {
	      zLength = 8 - zStartIndex;
	   }
	   if (zLength > 1 && zLength > zeroLength) {
	      zeroStartIndex = zStartIndex;
	      zeroLength = zLength;
	   }
	   //console.log(zeroStartIndex, zeroLength);
	   //console.log(sections);
	   if (zeroStartIndex >= 0 && zeroLength > 1) {
	      sections.splice(zeroStartIndex, zeroLength, 'g');
	   }
	   //console.log(sections);
	   a = sections.join(':');
	   //console.log(a);
	   a = a.replace(/\:g\:/g, '::');
	   a = a.replace(/\:g/g, '::');
	   a = a.replace(/g\:/g, '::');
	   a = a.replace(/g/g, '::');
	   //console.log(a);
	   return a;
	};

	// Basic validation
	const _validate = function (a) {
	   return /^[a-f0-9\\:]+$/ig.test(a);
	};

	const _leftPad = function (d, p, n) {
	   const padding = p.repeat(n);
	   if (d.length < padding.length) {
	      d = padding.substring(0, padding.length - d.length) + d;
	   }
	   return d;
	};

	const _hex2bin = function (hex) {
	   return parseInt(hex, 16).toString(2)
	};
	const _bin2hex = function (bin) {
	   return parseInt(bin, 2).toString(16)
	};

	const _addr2bin = function (addr) {
	   const nAddr = normalize(addr);
	   const sections = nAddr.split(":");
	   let binAddr = '';
	   for (const section of sections) {
	      binAddr += _leftPad(_hex2bin(section), '0', 16);
	   }
	   return binAddr;
	};

	const _bin2addr = function (bin) {
	   const addr = [];
	   for (let i = 0; i < 8; ++i) {
	      const binPart = bin.substr(i * 16, 16);
	      const hexSection = _leftPad(_bin2hex(binPart), '0', 4);
	      addr.push(hexSection);
	   }
	   return addr.join(':');
	};

	const divideSubnet = function (addr, mask0, mask1, limit, abbr) {
	   if (!_validate(addr)) {
	      throw new Error('Invalid address: ' + addr);
	   }
	   mask0 *= 1;
	   mask1 *= 1;
	   limit *= 1;
	   mask1 = mask1 || 128;
	   if (mask0 < 1 || mask1 < 1 || mask0 > 128 || mask1 > 128 || mask0 > mask1) {
	      throw new Error('Invalid masks.');
	   }
	   const ret = [];
	   const binAddr = _addr2bin(addr);
	   const binNetPart = binAddr.substr(0, mask0);
	   const binHostPart = '0'.repeat(128 - mask1);
	   const numSubnets = Math.pow(2, mask1 - mask0);
	   for (let i = 0; i < numSubnets; ++i) {
	      if (!!limit && i >= limit) {
	         break;
	      }
	      const binSubnet = _leftPad(i.toString(2), '0', mask1 - mask0);
	      const binSubAddr = binNetPart + binSubnet + binHostPart;
	      const hexAddr = _bin2addr(binSubAddr);
	      if (!!abbr) {
	         ret.push(abbreviate(hexAddr));
	      } else {
	         ret.push(hexAddr);
	      }

	   }
	   // console.log(numSubnets);
	   // console.log(binNetPart, binSubnetPart, binHostPart);
	   // console.log(binNetPart.length, binSubnetPart.length, binHostPart.length);
	   // console.log(ret.length);
	   return ret;
	};

	const range = function (addr, mask0, mask1, abbr) {
	   if (!_validate(addr)) {
	      throw new Error('Invalid address: ' + addr);
	   }
	   mask0 *= 1;
	   mask1 *= 1;
	   mask1 = mask1 || 128;
	   if (mask0 < 1 || mask1 < 1 || mask0 > 128 || mask1 > 128 || mask0 > mask1) {
	      throw new Error('Invalid masks.');
	   }
	   const binAddr = _addr2bin(addr);
	   const binNetPart = binAddr.substr(0, mask0);
	   const binHostPart = '0'.repeat(128 - mask1);
	   const binStartAddr = binNetPart + '0'.repeat(mask1 - mask0) + binHostPart;
	   const binEndAddr = binNetPart + '1'.repeat(mask1 - mask0) + binHostPart;
	   if (!!abbr) {
	      return {
	         start: abbreviate(_bin2addr(binStartAddr)),
	         end: abbreviate(_bin2addr(binEndAddr)),
	         size: Math.pow(2, mask1 - mask0)
	      };
	   } else {
	      return {
	         start: _bin2addr(binStartAddr),
	         end: _bin2addr(binEndAddr),
	         size: Math.pow(2, mask1 - mask0)
	      };
	   }
	};

	const randomSubnet = function (addr, mask0, mask1, limit, abbr) {
	   if (!_validate(addr)) {
	      throw new Error('Invalid address: ' + addr);
	   }
	   mask0 *= 1;
	   mask1 *= 1;
	   limit *= 1;
	   mask1 = mask1 || 128;
	   limit = limit || 1;
	   if (mask0 < 1 || mask1 < 1 || mask0 > 128 || mask1 > 128 || mask0 > mask1) {
	      throw new Error('Invalid masks.');
	   }
	   const ret = [];
	   const binAddr = _addr2bin(addr);
	   const binNetPart = binAddr.substr(0, mask0);
	   const binHostPart = '0'.repeat(128 - mask1);
	   const numSubnets = Math.pow(2, mask1 - mask0);
	   for (let i = 0; i < numSubnets && i < limit; ++i) {
	      // generate an binary string with length of mask1 - mask0
	      let binSubnet = '';
	      for (let j = 0; j < mask1 - mask0; ++j) {
	         binSubnet += Math.floor(Math.random() * 2);
	      }
	      const binSubAddr = binNetPart + binSubnet + binHostPart;
	      const hexAddr = _bin2addr(binSubAddr);
	      if (!!abbr) {
	         ret.push(abbreviate(hexAddr));
	      } else {
	         ret.push(hexAddr);
	      }
	   }
	   // console.log(numSubnets);
	   // console.log(binNetPart, binSubnetPart, binHostPart);
	   // console.log(binNetPart.length, binSubnetPart.length, binHostPart.length);
	   // console.log(ret.length);
	   return ret;
	};

	const ptr = function (addr, mask) {
	   if (!_validate(addr)) {
	      throw new Error('Invalid address: ' + addr);
	   }
	   mask *= 1;
	   if (mask < 1 || mask > 128 || Math.floor(mask / 4) != mask / 4) {
	      throw new Error('Invalid masks.');
	   }
	   const fullAddr = normalize(addr);
	   const reverse = fullAddr.replace(/:/g, '').split('').reverse();
	   return reverse.slice(0, (128 - mask) / 4).join('.');
	};

	{
	   exports.normalize = normalize;
	   exports.abbreviate = abbreviate;
	   exports.divideSubnet = divideSubnet;
	   exports.range = range;
	   exports.randomSubnet = randomSubnet;
	   exports.ptr = ptr;
	}
	});
	var ip6_1 = ip6.normalize;
	var ip6_2 = ip6.abbreviate;
	var ip6_3 = ip6.divideSubnet;
	var ip6_4 = ip6.range;
	var ip6_5 = ip6.randomSubnet;
	var ip6_6 = ip6.ptr;

	function isIP(addr) {
	    return ipaddr.isValid(addr);
	}
	function version(addr) {
	    try {
	        var parse_addr = ipaddr.parse(addr);
	        var kind = parse_addr.kind();
	        if (kind === 'ipv4') {
	            return 4; //IPv4
	        }
	        else if (kind === 'ipv6') {
	            return 6; //IPv6
	        }
	        else {
	            /* istanbul ignore next */
	            return 0; //not 4 or 6
	        }
	    }
	    catch (err) {
	        return 0; //not 4 or 6
	    }
	}
	function isV4(addr) {
	    return version(addr) === 4;
	}
	function isV6(addr) {
	    return version(addr) === 6;
	}
	function isRange(range) {
	    try {
	        var cidr = ipaddr.parseCIDR(range);
	        return true;
	    }
	    catch (err) {
	        return false;
	    }
	}
	function inRange(addr, range) {
	    if (typeof range === 'string') {
	        if (range.indexOf('/') !== -1) {
	            try {
	                var range_data = range.split('/');
	                var parse_addr = ipaddr.parse(addr);
	                var parse_range = ipaddr.parse(range_data[0]);
	                //@ts-ignore:  It works.
	                return parse_addr.match(parse_range, range_data[1]);
	            }
	            catch (err) {
	                return false;
	            }
	        }
	        else {
	            addr = isV6(addr) ? ip6.normalize(addr) : addr; //v6 normalize addr
	            range = isV6(range) ? ip6.normalize(range) : range; //v6 normalize range
	            return isIP(range) && addr === range;
	        }
	    }
	    else if (range && typeof range === 'object') {
	        //list
	        for (var check_range in range) {
	            if (inRange(addr, range[check_range]) === true) {
	                return true;
	            }
	        }
	        return false;
	    }
	    else {
	        return false;
	    }
	}
	function storeIP(addr) {
	    try {
	        var parse_addr = ipaddr.parse(addr);
	        var kind = parse_addr.kind();
	        if (kind === 'ipv4') {
	            //is a plain v4 address
	            return addr;
	        }
	        else if (kind === 'ipv6') {
	            //@ts-ignore:  it exists!
	            if (parse_addr.isIPv4MappedAddress()) {
	                //convert v4 mapped to v6 addresses to a v4 in it's original format
	                //@ts-ignore:  it exists!
	                return parse_addr.toIPv4Address().toString();
	            } //is a v6, abbreviate it
	            else {
	                return ip6.abbreviate(addr);
	            }
	        }
	        else {
	            return null; //invalid IP address
	        }
	    }
	    catch (err) {
	        return null; //invalid IP address
	    }
	}
	function displayIP(addr) {
	    try {
	        var parse_addr = ipaddr.parse(addr);
	        var kind = parse_addr.kind();
	        if (kind === 'ipv4') {
	            //is a plain v4 address
	            return addr;
	        }
	        else if (kind === 'ipv6') {
	            //@ts-ignore:  it exists!
	            if (parse_addr.isIPv4MappedAddress()) {
	                //convert v4 mapped to v6 addresses to a v4 in it's original format
	                //@ts-ignore:  it exists!
	                return parse_addr.toIPv4Address().toString();
	            } //is a v6, normalize it
	            else {
	                return ip6.normalize(addr);
	            }
	        }
	        else {
	            return ''; //invalid IP address
	        }
	    }
	    catch (err) {
	        return ''; //invalid IP address
	    }
	}

	exports.isIP = isIP;
	exports.version = version;
	exports.isV4 = isV4;
	exports.isV6 = isV6;
	exports.isRange = isRange;
	exports.inRange = inRange;
	exports.storeIP = storeIP;
	exports.searchIP = storeIP;
	exports.displayIP = displayIP;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=range-check.umd.js.map
