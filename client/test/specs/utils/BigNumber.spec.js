describe("BigNumber", () => {
    const x = new BigNumber(156083999);
    const y = new BigNumber('30998789');
    const z = new BigNumber('18446744073709600000');

    it('init', () => {
        expect(x.toString()).toEqual('156083999');
        expect(y.toString()).toEqual('30998789');
        expect(z.toString()).toEqual('18446744073709600000');
    });

    it('_bits', () => {
        expect(BigNumber._bits(x.buf)).toEqual(28);
        expect(BigNumber._bits(y.buf)).toEqual(25);
    });

    it('pow', () => {
        expect(x.pow(20).toString()).toEqual('73649138344038251009732225968084072825294643167269677060974464689314800847443460241390340392507406116245825708005206431408866432526888334069415531453938297518320001');
        expect(z.pow(100).toString()).toEqual('3908159226644263804999031401171725431461087496776926875423560766727572828178020472468735088565358978829422924946463847097314608220783732337498195134473572407563280205328431942081687768030120101317625997911897199995308305771925736410023670852430702056877879753851638013044235365599146000953953383262566929396417476533734506104953600012805562404676611542669211593430219422481464883188408491777656235622684245564257038837084495134683657870321549384957678919458518870369024019769958568359153762154010195920273756120933503453636967290762090426608890909296371106680787184700702900099025328733240685739617820762346500908126280797710899814125631818796560981573151110010157543474959203482243571897977942361873966119494223228209885671245526592766473196770837574894124883264178191532069361028309984062722860315144643327234142930548545903652571181428257050008735606606893081965560800194209744533232797496404638869410142379325409020915543909421964076321019164010043094817000525023718326613656633518818606587141389930734964732059761177414009803187302013649892205903307186248479461293297304403259387848189868561790022372813096347072312506892982089179789739351051277312536951538702457742629846359360370659426358241589681752648900940434498838790273486711364312672330477117631570034623763184858276377455766685515788734263822094629036132385347915913794599375619922401592456364957100274739695090582713399650276155441874410573693892270213004106137600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000');
    });

    it('mod Small Number', () => {
        expect(x.mod(20)).toEqual(x % 20);
        expect(z.mod(156083999)).toEqual(11054277);
        expect(z.mod(30998789)).toEqual(7498285);
    });

    it('add', () => {
        expect(x.add(y).toString()).toEqual((156083999 + 30998789).toString());
    });

    it('sub', () => {
        const a = new BigNumber(12);
        const b = new BigNumber(12);
        expect(a.sub(b).toString()).toEqual('0');

        expect(x.sub(y).toString()).toEqual((156083999 - 30998789).toString());
    });

    it('mul', () => {
        expect(x.mul(y).toString()).toEqual((156083999 * 30998789).toString());

        expect(z.mul(z).toString()).toEqual('340282366920940248517905132160000000000');
    });

    it('fromHex', () => {
        const hex = (156083999).toString(16);

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
        expect(bn0.bin.toString()).toEqual('10111');

        expect(x.bin.toString()).toEqual('1001010011011010011100011111');
        expect(y.bin.toString()).toEqual('1110110010000000100000101');
        expect(z.bin.toString()).toEqual('10000000000000000000000000000000000000000000000001011110100000000');

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

    it('divMod Small Number', () => {
        const bg1 = new BigNumber(300);
        const bg2 = new BigNumber('1248163264128256512');

        expect(() => bg1.divMod(0)).toThrow(new Error('Division by zero'));
        expect(() => bg2.divMod(0)).toThrow(new Error('Division by zero'));
        expect(() => bg2.divMod(new BigNumber(0))).toThrow(new Error('Division by zero'));

        expect(bg1.divMod(1).toString()).toEqual('300');
        expect(bg1.divMod(10).toString()).toEqual(Math.floor(300 / 10).toString());

        const divMod1 = bg2.divMod(123);
        expect(divMod1.toString()).toEqual('10147668814050865');
        expect(divMod1.R.toString()).toEqual('117');

        const divMod2 = bg2.divMod(2);
        expect(divMod2.toString()).toEqual('624081632064128256');
        expect(divMod2.R.toString()).toEqual('0');

        const divMod3 = bg2.divMod(NumberUtils.UINT32_MAX);
        expect(divMod3.toString()).toEqual('290610656');
        expect(divMod3.R.toString()).toEqual('1029760992');
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
        expect(a3.divMod(b3).R.toString()).toEqual('3044300644215271');

        const a4 = new BigNumber('1248163264128256512');
        const b4 = new BigNumber('10147668814050865');
        expect(a4.divMod(b4).toString()).toEqual('123');
        expect(a4.divMod(b4).R.toString()).toEqual('117');
    });
});

