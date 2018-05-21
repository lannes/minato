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

    it('getDifficultyFromBits Block 0', () => {
        const bits = 486604799;
        const difficulty = 1.0;
        const calculated_difficulty = BlockUtils.getDifficultyFromBits(bits);
        const allowed_error = 0.01;

        const block_difficulty = new BigNumber(difficulty);
        const sub = calculated_difficulty.sub(block_difficulty);
        expect(sub.compare(new BigNumber(allowed_error))).toBeLessThanOrEqual(0);
    });

    it('getDifficultyFromBits Block 32256', () => {
        const bits = 486594666;
        const difficulty = 1.18;
        const calculated_difficulty = BlockUtils.getDifficultyFromBits(bits);
        const allowed_error = 0.01;

        const block_difficulty = new BigNumber(difficulty);
        const sub = calculated_difficulty.sub(block_difficulty);
        expect(sub.compare(new BigNumber(allowed_error))).toBeLessThanOrEqual(0);
    });

    it('getDifficultyFromBits Block 111388', () => {
        const bits = 453062093;
        const difficulty = 55589.52;
        const calculated_difficulty = BlockUtils.getDifficultyFromBits(bits);
        const allowed_error = 0.01;

        const block_difficulty = new BigNumber(difficulty);
        const sub = calculated_difficulty.sub(block_difficulty);
        expect(sub.compare(new BigNumber(allowed_error))).toBeLessThanOrEqual(0);
    });

    it('getDifficultyFromBits Block 493955', () => {
        const bits = 402705995;
        const difficulty = 1364422081125.15;
        const calculated_difficulty = BlockUtils.getDifficultyFromBits(bits);
        const allowed_error = 0.01;

        const block_difficulty = new BigNumber(difficulty);
        const sub = calculated_difficulty.sub(block_difficulty);
        expect(sub.compare(new BigNumber(allowed_error))).toBeLessThanOrEqual(0);
    });

    it('changeTarget', () => {
        // starting_block is the initial block on this 2016 block runtime #403200
        const starting_block_timestamp = '2016-03-18T09:07:48';
        const starting_block_time_seconds = new Date(starting_block_timestamp).getTime() / 1000;

        // prev_block is the block right before the difficulty conversion #405215
        const prev_block_bits = 403088579;
        const prev_block_timestamp = '2016-04-01T06:24:09';
        const prev_block_time_seconds = new Date(prev_block_timestamp).getTime() / 1000;

        const calculated_new_target = BlockUtils.changeTarget(prev_block_bits, starting_block_time_seconds, prev_block_time_seconds);
        const calculated_new_bits = BlockUtils.getBitsFromTarget(calculated_new_target);

        // new_block is the first block of the next block #405216
        const new_bits = 403085044;
        const new_target = BlockUtils.getTargetFromBits(new_bits);

        // Calculated new target
        expect(calculated_new_target.hex).toEqual('696f4a7b94b94b94b94b94b94b94b94b94b94b94b94b94b');

        // New target from block
        expect(new_target.hex).toEqual('696f4000000000000000000000000000000000000000000');

        // Calculated new bits
        expect(calculated_new_bits.hex).toEqual('180696f4');

        // New bits from block
        expect(new_bits.toString(16)).toEqual('180696f4');
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

});
