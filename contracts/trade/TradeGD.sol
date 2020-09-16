pragma solidity >=0.6.0;
import "@openzeppelin/upgrades-core/contracts/Initializable.sol";
import "../Interfaces.sol";

contract TradeGD is Initializable {
    Uniswap public uniswap;
    cERC20 public GD;
    cERC20 public DAI;
    cERC20 public cDAI;
    Reserve public reserve;

    event GDTraded(string protocol,string action, address from, uint256 ethValue, uint256[] uniswap, uint256 gd);

    /**
    * @dev initialize the upgradable contract
    * @param _gd address of the GoodDollar token
    * @param _dai address of the DAI token
    * @param _cdai address of the cDAI token
    * @param _reserve address of the GoodDollar reserve
     */
    function initialize(address _gd, address _dai, address _cdai, address _reserve) initializer public {
        uniswap = Uniswap(address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D));
        GD = cERC20(_gd);
        DAI = cERC20(_dai);
        cDAI = cERC20(_cdai);
        reserve = Reserve(_reserve);
        GD.approve(address(uniswap), 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
        DAI.approve(address(cDAI),0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
        cDAI.approve(address(reserve),0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);

    }

    /**
    * @dev buy GD from reserve using ETH since reserve  is in cDAI
    * we first buy DAI from uniswap -> mint cDAI -> buy GD
    * @param minDAIAmount - the min amount of DAI to receive for buying with ETH
    * @param minGDAmount - the min amount of GD to receive for buying with cDAI(via DAI)
     */
    function buyGDFromReserve(uint256 minDAIAmount,uint256 minGDAmount) external payable returns(uint256) {
        uint256 gd = _buyGDFromReserve(minDAIAmount, minGDAmount);
        GD.transfer(msg.sender,gd);
        return gd;
    }

    function _buyGDFromReserve(uint256 minDAIAmount,uint256 minGDAmount) internal returns(uint256) {
        require(msg.value>0,"You must send some ETH");
        address[] memory path = new address[](2);
        path[1] = address(DAI);
        path[0] = uniswap.WETH();
        uint256[] memory swap = uniswap.swapExactETHForTokens{value:msg.value}(minDAIAmount, path, address(this), now);
        uint256 dai = swap[1];
        require(dai > 0, "DAI buying failed");
        uint256 cdaiRes = cDAI.mint(dai);
        require(cdaiRes == 0, "cDAI buying failed");
        uint256 cdai = cDAI.balanceOf(address(this));
        uint256 gd = reserve.buy(address(cDAI),cdai,minGDAmount);
        // uint256 gd = GD.balanceOf(address(this));
        require(gd>0, "gd buying failed");
        emit GDTraded("reserve","buy", msg.sender, msg.value, swap, gd);
        return gd;
    }

/**
    * @dev buy GD from uniswap pool using ETH since pool is in DAI
    * we first buy DAI from uniswap -> buy GD
    * @param minGDAmount - the min amount of GD to receive for buying with DAI(via ETH)
     */
    function buyGDFromUniswap(uint256 minGDAmount) external payable returns(uint256) {
        require(msg.value>0,"You must send some ETH");
        address[] memory path = new address[](3);
        path[2] = address(GD);
        path[1] = address(DAI);
        path[0] = uniswap.WETH();
        uint256[] memory swap = uniswap.swapExactETHForTokens{value: msg.value}(minGDAmount, path, address(msg.sender), now);
        uint256 gd = swap[2];
        require(gd>0, "gd buying failed");
        emit GDTraded("uniswap","buy", msg.sender, msg.value, swap, gd);
        return gd;
    }

    /** 
    * @dev buy GD from reserve using ETH and sell to uniswap pool resulting in DAI
    * @param minDAIAmount - the min amount of dai to receive for selling G$
    * @param minGDAmount - the min amount of GD to receive for buying with cDAI(via ETH)
    */
    function sellGDFromReserveToUniswap(uint256 minDAIAmount, uint256 minGDAmount) external payable returns(uint256) {
        uint256 gd = _buyGDFromReserve(minDAIAmount, minGDAmount);
        address[] memory path = new address[](2);
        path[0] = address(GD);
        path[1] = address(DAI);
        uint256[] memory swap = uniswap.swapExactTokensForTokens(gd, minDAIAmount, path, address(msg.sender), now );
        uint256 dai = swap[1];
        require(dai>0, "gd selling failed");
        emit GDTraded("uniswap","sell", msg.sender, msg.value, swap, gd);

        return  dai;
    }
    
}