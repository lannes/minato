describe("BlockUtils", () => {

    it('target', () => {
        const bits = 453062093;

        const hex_bits = bits.toString(16);
        expect(hex_bits).toEqual('1b012dcd');

        const shift_int = parseInt('1b', 16);
        expect(shift_int).toEqual(27);

        const value_int = BigNumber.fromHex('0x012dcd');
        expect(value_int.toString()).toEqual('77261');

        const shift = bits >> 24;
        expect(shift).toEqual(shift_int);

        const value = new BigNumber(bits & 0x007fffff);
        expect(value.toString()).toEqual('77261');

        //target = value * 2 ** (8 * (shift - 3))
        const target1 = value.mul((new BigNumber(2)).pow(8 * (shift - 3)));
        expect(target1.hex).toEqual('12dcd000000000000000000000000000000000000000000000000');

        const target = value.shiftLeft(8 * (shift - 3));
        expect(target.hex).toEqual('12dcd000000000000000000000000000000000000000000000000');
    });

    it('getTargetFromBits', () => {
        const bits0 = 453062093;
        const target0 = BlockUtils.getTargetFromBits(bits0);
        expect(target0.hex).toEqual('12dcd000000000000000000000000000000000000000000000000');

        const bits1 = 403088579;
        const target1 = BlockUtils.getTargetFromBits(bits1);
        expect(target1.hex).toEqual('6a4c3000000000000000000000000000000000000000000');
    });

    it('getBitsFromTarget', () => {
        const target = BigNumber.fromHex('0x6a4c3000000000000000000000000000000000000000000');
        const bits = BlockUtils.getBitsFromTarget(target);
        expect(bits.toString()).toEqual('403088579');
        expect(bits.hex).toEqual('1806a4c3');
    });

    it('Determining if a Hash is less than the Target', () => {
        const target = BlockUtils.getTargetFromBits(453062093);
        const hex_target = target.hex;
        const hex_target_len = hex_target.length;
        const num_padded_zeros = 64 - hex_target_len;
        let padded_hex_target = hex_target;
        while (padded_hex_target.length < 64)
            padded_hex_target = '0' + padded_hex_target;

        expect(padded_hex_target).toEqual('0000000000012dcd000000000000000000000000000000000000000000000000');
        expect(hex_target_len).toEqual(53);

        const block_hash = BigNumber.fromHex('0x00000000000019c6573a179d385f6b15f4b0645764c4960ee02b33a3c7117d1e');
        const padded_target = BigNumber.fromHex('0x' + padded_hex_target);

        expect(block_hash.compare(padded_target)).toBeLessThanOrEqual(0);

        expect(block_hash.toString()).toEqual('41418456048005639864974238890271849696605172030151526454492446');
        expect(target.toString()).toEqual('484975157177710342494716926626447514974484083994735770500857856');


        expect(target.sub(block_hash).toString()).toEqual('443556701129704702629742687736175665277878911964584244046365410');
    });

    it('difficulty_one_target = 0x00ffff * 2**(8*(0x1d - 3))', () => {
        const target = BlockUtils.getTargetFromBits(453062093);

        const difficulty_one_target = BigNumber.fromHex('0x00ffff').shiftLeft(8 * (0x1d - 3));
        expect(difficulty_one_target.toString()).toEqual('26959535291011309493156476344723991336010898738574164086137773096960');

        const calculated_difficulty = difficulty_one_target.divMod(target);
        expect(calculated_difficulty.toString()).toEqual('55589');

    });
});
