describe("BigNumber", () => {
    const x = new BigNumber(156083999);
    const y = new BigNumber('30998789');
    const z = new BigNumber(3);

    it('init', () => {
        expect(x.toString(10)).toEqual('156083999');
        expect(y.toString(10)).toEqual('30998789');
    });

    it('pow', () => {
        expect(z.pow(20).toString(10)).toEqual(Math.pow(3, 20).toString());
    });

    it('mod', () => {
        expect(x.mod(20)).toEqual(x % 20);
    });

    it('add', () => {
        expect(x.add(y).toString(10)).toEqual((156083999 + 30998789).toString());
    });

    it('sub', () => {
        expect(x.sub(y).toString(10)).toEqual((156083999 - 30998789).toString());
    });

    it('mul', () => {
        expect(x.mul(y).toString(10)).toEqual((156083999 * 30998789).toString());
    });

    it('hex', () => {
        expect(x.hex).toEqual((156083999).toString(16));
    });

    it('_divBase10String', () => {
        const w3 = BigNumber._divBase10String('1248163264128256512', 123).Q;
        expect(w3.toString(10)).toEqual('10147668814050865');
        
        const w4 = BigNumber._divBase10String('1248163264128256512', 2).Q;
        expect(w4.toString(10)).toEqual('624081632064128256');

        const a0 = BigNumber._divBase10String('30998789', 2 ** 20).Q;
        expect(a0.toString(10)).toEqual('29');
        
        const a1 = BigNumber._divBase10String('29', 2 ** 20).Q;
        expect(a1.toString(10)).toEqual('0');
        
        const a2 = BigNumber._divBase10String('1248163264128256512', 2 ** 20).Q;
        expect(a2.toString(10)).toEqual('1190341247680');
        
        const a3 = BigNumber._divBase10String('1248163264128256512', 2).Q;
        expect(a3.toString(10)).toEqual('624081632064128256');
        
        const a4 = BigNumber._divBase10String('1248163264128256512', 123).Q;
        expect(a4.toString(10)).toEqual('10147668814050865');
    });

    it('div', () => {
        const w1 = new BigNumber(300);
        const w2 = new BigNumber('1248163264128256512');

        expect(w1.div(10).toString(10)).toEqual(Math.floor(300 / 10).toString());
        expect(w2.div(123).toString(10)).toEqual('10147668814050865');
        expect(w2.div(2).toString(10)).toEqual('624081632064128256');
    });
});

//console.log(`BIN ${x.bin.buf}`);
