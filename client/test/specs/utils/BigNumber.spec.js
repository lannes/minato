describe("BigNumber", () => {
    const x = new BigNumber(156083999);
    const y = new BigNumber('30998789');
    const z = new BigNumber('18446744073709600000');

    it('init', () => {
        expect(x.toString()).toEqual('156083999');
        expect(y.toString()).toEqual('30998789');
        expect(z.toString()).toEqual('18446744073709600000');
    });

    it('compare', () => {
        const a = new BigNumber(-1);
        const b = new BigNumber(-5);
        expect(a.compare(b)).toBeGreaterThan(0);
        expect(b.compare(a)).toBeLessThan(0);

        const c = new BigNumber(-1.5);
        const d = new BigNumber(-1.4);
        expect(c.compare(d)).toBeLessThan(0);
        expect(d.compare(c)).toBeGreaterThan(0);

        const e = new BigNumber(1.5);
        const f = new BigNumber(1.4);
        expect(e.compare(f)).toBeGreaterThan(0);
        expect(f.compare(e)).toBeLessThan(0);

        const g = new BigNumber(-1.5);
        const h = new BigNumber(1.4);
        expect(g.compare(h)).toBeLessThan(0);
        expect(h.compare(g)).toBeGreaterThan(0);

        const i = new BigNumber(1.5);
        const j = new BigNumber(-1.4);
        expect(i.compare(j)).toBeGreaterThan(0);
        expect(j.compare(i)).toBeLessThan(0);

        const k = new BigNumber(1.5);
        const l = new BigNumber(-1.5);
        expect(k.compare(l)).toBeGreaterThan(0);
        expect(l.compare(k)).toBeLessThan(0);

        const m = new BigNumber(0);
        const n = new BigNumber(-0.1);
        expect(m.compare(n)).toBeGreaterThan(0);
        expect(n.compare(m)).toBeLessThan(0);
    });

    it('bitLength', () => {
        expect(x.bitLength).toEqual(28);
        expect(y.bitLength).toEqual(25);
    });

    it('pow', () => {
        expect(x.pow(20).toString()).toEqual('73649138344038251009732225968084072825294643167269677060974464689314800847443460241390340392507406116245825708005206431408866432526888334069415531453938297518320001');
        expect(z.pow(100).toString()).toEqual('3908159226644263804999031401171725431461087496776926875423560766727572828178020472468735088565358978829422924946463847097314608220783732337498195134473572407563280205328431942081687768030120101317625997911897199995308305771925736410023670852430702056877879753851638013044235365599146000953953383262566929396417476533734506104953600012805562404676611542669211593430219422481464883188408491777656235622684245564257038837084495134683657870321549384957678919458518870369024019769958568359153762154010195920273756120933503453636967290762090426608890909296371106680787184700702900099025328733240685739617820762346500908126280797710899814125631818796560981573151110010157543474959203482243571897977942361873966119494223228209885671245526592766473196770837574894124883264178191532069361028309984062722860315144643327234142930548545903652571181428257050008735606606893081965560800194209744533232797496404638869410142379325409020915543909421964076321019164010043094817000525023718326613656633518818606587141389930734964732059761177414009803187302013649892205903307186248479461293297304403259387848189868561790022372813096347072312506892982089179789739351051277312536951538702457742629846359360370659426358241589681752648900940434498838790273486711364312672330477117631570034623763184858276377455766685515788734263822094629036132385347915913794599375619922401592456364957100274739695090582713399650276155441874410573693892270213004106137600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000');
    });

    it('mod int32', () => {
        expect(x.mod(20)).toEqual(x % 20);
        expect(z.mod(156083999)).toEqual(11054277);
        expect(z.mod(30998789)).toEqual(7498285);
    });

    it('mod BigNumber', () => {
        const a = new BigNumber('41418456048005639864974238890271849696605172030151526454492446');
        const b = new BigNumber('63986497423889027184969660517203015152645449244');

        expect(a.mod(b).toString()).toEqual('6589218484640224298734570429280357277479265278');
    });

    it('add', () => {
        expect(x.add(y).toString()).toEqual((156083999 + 30998789).toString());

        const a = new BigNumber(1.8);
        const b = new BigNumber(2.9);
        expect(a.add(b).toString()).toEqual('4.7');

        const c = new BigNumber(5);
        const d = new BigNumber(1);
        const e = new BigNumber(-5);
        const f = new BigNumber(-1);
        expect(c.add(d).toString()).toEqual((5 + 1).toString());
        expect(c.add(f).toString()).toEqual((5 + -1).toString());
        expect(e.add(d).toString()).toEqual((-5 + 1).toString());
        expect(e.add(f).toString()).toEqual((-5 + -1).toString());
    });

    it('sub', () => {
        const a = new BigNumber(12);
        const b = new BigNumber(12);
        expect(a.sub(b).toString()).toEqual('0');

        expect(x.sub(y).toString()).toEqual((156083999 - 30998789).toString());

        const c = new BigNumber(5);
        const d = new BigNumber(1);
        const e = new BigNumber(-5);
        const f = new BigNumber(-1);
        expect(c.sub(d).toString()).toEqual('4'); // 5 - 1
        expect(c.sub(f).toString()).toEqual('6'); // 5 - -1
        expect(e.sub(d).toString()).toEqual('-6'); // -5 - 1
        expect(e.sub(f).toString()).toEqual('-4'); // -5 - -1
        expect(d.sub(c).toString()).toEqual('-4'); // 1 - 5
        expect(d.sub(e).toString()).toEqual('6'); // 1 - -5
        expect(f.sub(c).toString()).toEqual('-6'); // -1 - 5
        expect(f.sub(e).toString()).toEqual('4'); // -1 - -5

        const a1 = new BigNumber('41418456048005639864974238890271849696605172030151526454492446');
        const b1 = new BigNumber('484975157177710342494716926626447514974484083994735770500857856');
        expect(a1.sub(b1).toString()).toEqual('-443556701129704702629742687736175665277878911964584244046365410');
    });

    it('mul', () => {
        expect(x.mul(y).toString()).toEqual((156083999 * 30998789).toString());

        expect(z.mul(z).toString()).toEqual('340282366920940248517905132160000000000');
    });

    it('fromByteArray', () => {
        const hex = '012dcd000000000000000000000000000000000000000000000000';
        const arr = Uint8Array.from(hex.match(/.{2}/g) || [], byte => parseInt(byte, 16));
        const bn = BigNumber.fromByteArray(arr);
        expect(bn.hex).toEqual('12dcd000000000000000000000000000000000000000000000000');

        const hex1 = '0696f4a7b94b94b94b94b94b94b94b94b94b94b94b94b94b';
        const arr1 = Uint8Array.from(hex1.match(/.{2}/g) || [], byte => parseInt(byte, 16));
        const bn1 = BigNumber.fromByteArray(arr1);
        expect(bn1.hex).toEqual('696f4a7b94b94b94b94b94b94b94b94b94b94b94b94b94b');

        const hex2 = '1806a4c3';
        const arr2 = Uint8Array.from(hex2.match(/.{2}/g) || [], byte => parseInt(byte, 16));
        const bn2 = BigNumber.fromByteArray(arr2);
        expect(bn2.hex).toEqual('1806a4c3');

        const hex3 = '1806a4c3df';
        const arr3 = Uint8Array.from(hex3.match(/.{2}/g) || [], byte => parseInt(byte, 16));
        const bn3 = BigNumber.fromByteArray(arr3);
        expect(bn3.hex).toEqual('1806a4c3df');

        const hex4 = '1806a4c3df12';
        const arr4 = Uint8Array.from(hex4.match(/.{2}/g) || [], byte => parseInt(byte, 16));
        const bn4 = BigNumber.fromByteArray(arr4);
        expect(bn4.hex).toEqual('1806a4c3df12');
    });

    it('fromHex', () => {
        const hex = '0x' + (156083999).toString(16);

        const bg = BigNumber.fromHex(hex);
        expect(bg.toString()).toEqual('156083999');
    });

    it('hex', () => {
        const bn0 = new BigNumber(156083999);
        expect(bn0.hex).toEqual((156083999).toString(16));

        expect(z.hex).toString('1000000000000bd00');

        const bn1 = new BigNumber('484975157177710342494716926626447514974484083994735770500857856');
        expect(bn1.hex).toEqual('12dcd000000000000000000000000000000000000000000000000');
    });

    it('bin', () => {
        const bn0 = new BigNumber(23);
        expect(bn0.bin).toEqual('10111');

        expect(x.bin).toEqual('1001010011011010011100011111');
        expect(y.bin).toEqual('1110110010000000100000101');
        expect(z.bin).toEqual('10000000000000000000000000000000000000000000000001011110100000000');

        const bn1 = new BigNumber('484975157177710342494716926626447514974484083994735770500857856');
        expect(bn1.bin).toEqual('10010110111001101000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000');
    });

    it('shiftLeft', () => {
        const bg0 = new BigNumber(5);
        expect(bg0.shiftLeft(0).bin).toEqual('101');
        expect(bg0.shiftLeft(1).bin).toEqual('1010');
        expect(bg0.shiftLeft(2).bin).toEqual('10100');
        expect(bg0.shiftLeft(3).bin).toEqual('101000');
        expect(bg0.shiftLeft(4).bin).toEqual('1010000');
        expect(bg0.shiftLeft(5).bin).toEqual('10100000');
        expect(bg0.shiftLeft(6).bin).toEqual('101000000');

        const bg1 = new BigNumber(255);
        expect(bg1.shiftLeft(0).bin).toEqual('11111111');
        expect(bg1.shiftLeft(1).bin).toEqual('111111110');
        expect(bg1.shiftLeft(2).bin).toEqual('1111111100');
        expect(bg1.shiftLeft(3).bin).toEqual('11111111000');

        const bg2 = new BigNumber(1289);
        expect(bg2.shiftLeft(0).bin).toEqual('10100001001');
        expect(bg2.shiftLeft(1).bin).toEqual('101000010010');
        expect(bg2.shiftLeft(2).bin).toEqual('1010000100100');
        expect(bg2.shiftLeft(3).bin).toEqual('10100001001000');

        const bg3 = new BigNumber('18446744073709600000');
        expect(bg3.shiftLeft(1).toString()).toEqual('36893488147419200000');
        expect(bg3.shiftLeft(2).toString()).toEqual('73786976294838400000');
        expect(bg3.shiftLeft(3).toString()).toEqual('147573952589676800000');
        expect(bg3.shiftLeft(4).toString()).toEqual('295147905179353600000');
    });

    it('shiftRight', () => {
        const bg0 = new BigNumber(255);
        expect(bg0.shiftRight(0).bin).toEqual('11111111');
        expect(bg0.shiftRight(1).bin).toEqual('1111111');
        expect(bg0.shiftRight(2).bin).toEqual('111111');
        expect(bg0.shiftRight(3).bin).toEqual('11111');
        expect(bg0.shiftRight(4).bin).toEqual('1111');

        const bg1 = new BigNumber(1289);
        expect(bg1.shiftRight(0).bin).toEqual('10100001001');
        expect(bg1.shiftRight(1).bin).toEqual('1010000100');
        expect(bg1.shiftRight(2).bin).toEqual('101000010');
        expect(bg1.shiftRight(3).bin).toEqual('10100001');
        expect(bg1.shiftRight(4).bin).toEqual('1010000');
        expect(bg1.shiftRight(5).bin).toEqual('101000');
        expect(bg1.shiftRight(6).bin).toEqual('10100');
        expect(bg1.shiftRight(7).bin).toEqual('1010');
        expect(bg1.shiftRight(8).bin).toEqual('101');
        expect(bg1.shiftRight(9).bin).toEqual('10');
        expect(bg1.shiftRight(10).bin).toEqual('1');
        expect(bg1.shiftRight(11).bin).toEqual('0');

        const bg2 = new BigNumber('18446744073709600000');
        expect(bg2.shiftRight(1).toString()).toEqual('9223372036854800000');
        expect(bg2.shiftRight(2).toString()).toEqual('4611686018427400000');
        expect(bg2.shiftRight(3).toString()).toEqual('2305843009213700000');
        expect(bg2.shiftRight(4).toString()).toEqual('1152921504606850000');
    });

    it('_divBaseString', () => {
        const bg0 = BigNumber._divBaseString('1248163264128256512', 123).Q;
        expect(bg0.toString()).toEqual('10147668814050865');

        const bg1 = BigNumber._divBaseString('1248163264128256512', 2).Q;
        expect(bg1.toString()).toEqual('624081632064128256');

        const a0 = BigNumber._divBaseString('30998789', 2 ** 20).Q;
        expect(a0.toString()).toEqual('29');

        const a1 = BigNumber._divBaseString('29', 2 ** 20).Q;
        expect(a1.toString()).toEqual('0');

        const a2 = BigNumber._divBaseString('1248163264128256512', 2 ** 20).Q;
        expect(a2.toString()).toEqual('1190341247680');

        const a3 = BigNumber._divBaseString('1248163264128256512', 2).Q;
        expect(a3.toString()).toEqual('624081632064128256');

        const a4 = BigNumber._divBaseString('1248163264128256512', 123).Q;
        expect(a4.toString()).toEqual('10147668814050865');
    });

    it('divMod int32', () => {
        const bg1 = new BigNumber(300);
        const bg2 = new BigNumber('1248163264128256512');

        expect(() => bg1.divMod(0)).toThrow(new Error('Division by zero'));
        expect(() => bg2.divMod(0)).toThrow(new Error('Division by zero'));
        expect(() => bg2.divMod(new BigNumber(0))).toThrow(new Error('Division by zero'));

        expect(bg1.divMod(1).toString()).toEqual('300');
        expect(bg1.divMod(10).toString()).toEqual(Math.floor(300 / 10).toString());

        const divMod1 = bg2.divMod(123);
        expect(divMod1.toString()).toEqual('10147668814050865');
        expect(divMod1.remainder.toString()).toEqual('117');

        const divMod2 = bg2.divMod(2);
        expect(divMod2.toString()).toEqual('624081632064128256');
        expect(divMod2.remainder.toString()).toEqual('0');

        const divMod3 = bg2.divMod(NumberUtils.UINT32_MAX);
        expect(divMod3.toString()).toEqual('290610656');
        expect(divMod3.remainder.toString()).toEqual('1029760992');
    });

    it('divMod BigNumber', () => {
        const a0 = new BigNumber(12);
        const b0 = new BigNumber(4);
        expect(a0.divMod(b0).toString()).toEqual('3');

        const a2 = new BigNumber('21474836475');
        const b2 = new BigNumber(4294967295);
        expect(a2.divMod(b2).toString()).toEqual('5');

        const a3 = new BigNumber('124816326412825651');
        const b3 = new BigNumber('10147668814050865');
        expect(a3.divMod(b3).toString()).toEqual('12');
        expect(a3.divMod(b3).remainder.toString()).toEqual('3044300644215271');

        const a4 = new BigNumber('1248163264128256512');
        const b4 = new BigNumber('10147668814050865');
        expect(a4.divMod(b4).toString()).toEqual('123');
        expect(a4.divMod(b4).remainder.toString()).toEqual('117');
    });

    it('div BigNumber', () => {
        const a = new BigNumber(1);
        const b = new BigNumber(5);
        const c = a.div(b);

        expect(c.toString()).toEqual('0.2');
    });

    it('float & negative', () => {
        const a = new BigNumber(0.1);
        const b = new BigNumber(0.9);
        expect(a.sub(b).toString()).toEqual((0.1 - 0.9).toString());

        const c = new BigNumber(7.0);
        const d = new BigNumber(6.9);
        expect(c.sub(d).toString()).toEqual((7.0 - 6.9).toString());

        const e = new BigNumber(7.1);
        const f = new BigNumber(7.9);
        expect(e.sub(f).toString()).toEqual((7.1 - 7.9).toString());

        const g = new BigNumber(-7.1);
        const h = new BigNumber(7.9);
        expect(g.sub(h).toString()).toEqual((-7.1 - 7.9).toString());
    });

    it('toSmall', () => {
        const a = new BigNumber([2 ** 24 - 1, 2 ** 24 - 1]);
        expect(a.toSmall()).toEqual(281474976710655);

        const b = new BigNumber([0, 0, 1]);
        expect(b.toSmall()).toEqual(281474976710656);

        const c = new BigNumber([0, 0, 31]);
        expect(c.toSmall()).toEqual(8725724278030336);

        const d = new BigNumber([0, 0, 32]);
        expect(() => d.toSmall()).toThrow(new Error('Value too large'));
    });
});

